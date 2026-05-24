const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const Logger = require('../utils/logger');
const CommandHandler = require('./CommandHandler');
const EventEmitter = require('events');

class Bot extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.commandHandler = null;
    this.connectionState = 'disconnected'; // disconnected, connecting, open, close
    this.startTime = Date.now();
    this.stats = {
      messagesProcessed: 0,
      commandsExecuted: 0,
      errors: 0,
    };
    this.pairingCodeRequested = false;
    this.pendingPairingResolve = null;
    this.pendingPairingReject = null;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  get isConnected() {
    return this.connectionState === 'open';
  }

  async initialize(phoneNumber = null, forPairing = false) {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      Logger.warn('Bot is already initializing, waiting...');
      await this.waitForConnection(30000);
      return this.socket;
    }

    this.isInitializing = true;

    try {
      Logger.info('Initializing MIRA-MD Bot...');
      this.connectionState = 'connecting';
      this.emit('connection', { state: 'connecting' });

      // Ensure session directory exists
      const sessionPath = path.join(__dirname, '../../sessions', config.bot.sessionName);
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      // Get auth state
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      // Check if we're already registered
      const isRegistered = state.creds?.registered;
      Logger.info(`Session registered: ${isRegistered}`);

      // Fetch latest Baileys version
      const { version } = await fetchLatestBaileysVersion();
      Logger.info(`Using Baileys version: ${version.join('.')}`);

      // Create socket connection
      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: !phoneNumber && !forPairing, // Only show QR if no phone number and not for pairing
        browser: Browsers.ubuntu('Chrome'),
        logger: pino({ level: config.env === 'development' ? 'debug' : 'silent' }),
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
      });

      // Initialize command handler
      this.commandHandler = new CommandHandler(this.socket);

      // Setup event handlers
      await this.setupEventHandlers(saveCreds, phoneNumber);

      return this.socket;
    } catch (error) {
      this.connectionState = 'disconnected';
      this.isInitializing = false;
      Logger.error('Failed to initialize bot', error);
      throw error;
    }
  }

  async setupEventHandlers(saveCreds, phoneNumber) {
    // Connection update handler
    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      Logger.debug('Connection update:', JSON.stringify(update, null, 2));

      // Handle QR code
      if (qr && !phoneNumber) {
        Logger.info('QR Code received. Scan with WhatsApp to connect.');
        this.emit('qr', qr);
        try {
          const qrcode = require('qrcode-terminal');
          qrcode.generate(qr, { small: true });
        } catch (e) {
          // qrcode-terminal might not be installed
        }
      }

      // Handle pairing code request - IMPORTANT: wait for proper connection state
      if (phoneNumber && !this.pairingCodeRequested && !this.socket.authState.creds.registered) {
        this.pairingCodeRequested = true;
        this.isInitializing = false;

        // Wait a bit for socket to stabilize
        await this.delay(2000);

        try {
          Logger.info(`Requesting pairing code for: ${phoneNumber}`);
          const code = await this.socket.requestPairingCode(phoneNumber);
          Logger.success(`Pairing code generated: ${code}`);
          
          this.emit('pairing-code', { phoneNumber, code });

          // Resolve pending promise if exists
          if (this.pendingPairingResolve) {
            this.pendingPairingResolve(code);
            this.pendingPairingResolve = null;
            this.pendingPairingReject = null;
          }
        } catch (error) {
          Logger.error('Failed to request pairing code', error);
          this.emit('pairing-error', error);

          if (this.pendingPairingReject) {
            this.pendingPairingReject(error);
            this.pendingPairingResolve = null;
            this.pendingPairingReject = null;
          }
        }
      }

      // Handle connection states
      if (connection === 'close') {
        this.connectionState = 'close';
        this.isInitializing = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        Logger.warn(
          `Connection closed. Status: ${statusCode}, Reason: ${lastDisconnect?.error?.message || 'Unknown'}`
        );

        this.emit('connection', { 
          state: 'disconnected', 
          reason: lastDisconnect?.error?.message,
          statusCode 
        });

        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(5000 * this.reconnectAttempts, 30000);
          Logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay/1000}s...`);
          setTimeout(() => this.initialize(null, false), delay);
        } else if (statusCode === DisconnectReason.loggedOut) {
          Logger.error('Logged out. Please delete session folder and re-authenticate.');
          this.connectionState = 'disconnected';
          // Clear session on logout
          const sessionPath = path.join(__dirname, '../../sessions', config.bot.sessionName);
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            Logger.info('Session cleared. Ready for new pairing.');
          }
        }
      }

      if (connection === 'connecting') {
        this.connectionState = 'connecting';
        this.emit('connection', { state: 'connecting' });
        Logger.info('Connecting to WhatsApp...');
      }

      if (connection === 'open') {
        this.connectionState = 'open';
        this.isInitializing = false;
        this.pairingCodeRequested = false;
        this.reconnectAttempts = 0;
        
        Logger.success('Bot connected successfully!');
        Logger.info(`Bot Name: ${config.bot.name}`);
        Logger.info(`Prefix: ${config.bot.prefix}`);
        Logger.info(`User: ${this.socket.user?.id || 'Unknown'}`);

        this.emit('connection', { 
          state: 'connected',
          user: this.socket.user 
        });
      }
    });

    // Credentials update handler
    this.socket.ev.on('creds.update', saveCreds);

    // Message handler
    this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        try {
          // Skip if message is from bot itself
          if (message.key.fromMe) continue;

          // Skip if no message content
          if (!message.message) continue;

          this.stats.messagesProcessed++;
          this.emit('message', message);

          // Handle command
          const wasCommand = await this.commandHandler.handleMessage(message);
          if (wasCommand) {
            this.stats.commandsExecuted++;
          }
        } catch (error) {
          this.stats.errors++;
          Logger.error('Error processing message', error);
        }
      }
    });

    // Group events handler
    this.socket.ev.on('group-participants.update', async (update) => {
      Logger.debug('Group participants update', update);
      this.emit('group-update', update);
    });
  }

  /**
   * Request pairing code with proper socket initialization
   * This is the CORRECT way to generate a pairing code
   */
  async requestPairingCode(phoneNumber) {
    // Validate phone number format (E.164 without +)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      throw new Error('Invalid phone number format. Must be 10-15 digits with country code.');
    }

    Logger.info(`Initiating pairing for: ${cleanNumber}`);

    // Check if already connected
    if (this.isConnected) {
      throw new Error('Bot is already connected. Disconnect first to pair a new number.');
    }

    // Clear any existing session for new pairing
    const sessionPath = path.join(__dirname, '../../sessions', config.bot.sessionName);
    if (fs.existsSync(sessionPath)) {
      Logger.info('Clearing existing session for new pairing...');
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // Create a promise that will be resolved when pairing code is received
    return new Promise(async (resolve, reject) => {
      this.pendingPairingResolve = resolve;
      this.pendingPairingReject = reject;

      // Set timeout for pairing
      const timeout = setTimeout(() => {
        if (this.pendingPairingReject) {
          this.pendingPairingReject(new Error('Pairing timeout. Please try again.'));
          this.pendingPairingResolve = null;
          this.pendingPairingReject = null;
        }
      }, 60000); // 60 second timeout

      try {
        // Initialize with phone number for pairing
        await this.initialize(cleanNumber, true);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }

      // Clear timeout on success (handled in event handler)
      this.once('pairing-code', () => clearTimeout(timeout));
      this.once('pairing-error', () => clearTimeout(timeout));
    });
  }

  /**
   * Wait for connection to be ready
   */
  async waitForConnection(timeout = 30000) {
    if (this.isConnected) return true;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      const checkConnection = () => {
        if (this.isConnected) {
          clearTimeout(timeoutId);
          resolve(true);
        } else if (this.connectionState === 'disconnected') {
          clearTimeout(timeoutId);
          reject(new Error('Connection failed'));
        }
      };

      this.on('connection', (update) => {
        if (update.state === 'connected') {
          clearTimeout(timeoutId);
          resolve(true);
        }
      });

      // Check immediately and set interval
      checkConnection();
      const interval = setInterval(checkConnection, 500);

      setTimeout(() => clearInterval(interval), timeout);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      connected: this.isConnected,
      connectionState: this.connectionState,
      uptime: Date.now() - this.startTime,
      stats: this.stats,
      botInfo: this.socket?.user || null,
    };
  }

  getUptime() {
    const ms = Date.now() - this.startTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  }

  async disconnect() {
    Logger.warn('Disconnecting bot...');
    if (this.socket) {
      try {
        this.socket.end();
      } catch (e) {
        // Ignore
      }
    }
    this.connectionState = 'disconnected';
    this.socket = null;
  }

  async shutdown() {
    Logger.warn('Shutting down bot...');
    if (this.socket) {
      try {
        await this.socket.logout();
        this.socket.end();
      } catch (e) {
        Logger.error('Error during shutdown', e);
      }
    }
    this.connectionState = 'disconnected';
  }
}

module.exports = Bot;
