const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
const config = require('../config/config');
const Logger = require('../utils/logger');
const Bot = require('../core/Bot');

class ApiServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.server.dashboardUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    this.bot = new Bot();
    this.activityLog = [];
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupBotEvents();
  }

  setupMiddleware() {
    // CORS - allow multiple origins
    const allowedOrigins = [
      config.server.dashboardUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      /\.vercel\.app$/,
    ];

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          
          const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) return allowed.test(origin);
            return allowed === origin;
          });
          
          if (isAllowed) {
            callback(null, true);
          } else {
            Logger.warn(`Blocked CORS request from: ${origin}`);
            callback(null, true); // Allow anyway for development
          }
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      })
    );

    // JSON parsing
    this.app.use(express.json());

    // Rate limiting for pairing endpoint
    const pairingLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 3, // 3 requests per 5 minutes
      message: {
        success: false,
        message: 'Too many pairing requests. Please wait 5 minutes before trying again.',
      },
      keyGenerator: (req) => {
        return req.body?.number || req.ip;
      },
    });

    // General API rate limiting
    const generalLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
      },
    });

    this.app.use('/api/pair', pairingLimiter);
    this.app.use('/api/', generalLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      Logger.debug(`${req.method} ${req.path} from ${req.ip}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        botState: this.bot.connectionState,
        timestamp: new Date().toISOString(),
      });
    });

    // Get bot status
    this.app.get('/api/status', (req, res) => {
      try {
        const status = this.bot.getStatus();
        res.json({
          success: true,
          status: status.connectionState,
          connected: status.connected,
          stats: {
            messagesProcessed: status.stats.messagesProcessed,
            activeUsers: 0,
            commandsExecuted: status.stats.commandsExecuted,
            uptime: this.bot.getUptime(),
            errors: status.stats.errors,
          },
          bot: {
            name: config.bot.name,
            version: config.bot.version || '1.0.0',
            prefix: config.bot.prefix,
            commandsLoaded: this.bot.commandHandler?.commands?.size || 0,
            user: status.botInfo ? {
              id: status.botInfo.id,
              name: status.botInfo.name,
            } : null,
          },
          recentActivity: this.activityLog.slice(-10),
        });
      } catch (error) {
        Logger.error('Status endpoint error', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get status',
        });
      }
    });

    // Generate pairing code - THE CRITICAL ENDPOINT
    this.app.post('/api/pair', async (req, res) => {
      try {
        const { number } = req.body;

        if (!number) {
          return res.status(400).json({
            success: false,
            message: 'Phone number is required',
          });
        }

        // Clean and validate phone number (E.164 format without +)
        const cleanNumber = number.replace(/\D/g, '');
        
        // Validation
        if (cleanNumber.length < 10) {
          return res.status(400).json({
            success: false,
            message: 'Phone number too short. Include country code (e.g., 14155551234 for US)',
          });
        }

        if (cleanNumber.length > 15) {
          return res.status(400).json({
            success: false,
            message: 'Phone number too long. Maximum 15 digits.',
          });
        }

        // Check if already connected
        if (this.bot.isConnected) {
          return res.status(400).json({
            success: false,
            message: 'Bot is already connected. Use /api/disconnect first to pair a new number.',
          });
        }

        Logger.info(`Pairing request for: ${cleanNumber}`);
        this.addActivity('pairing', `Pairing requested for ${cleanNumber.slice(0, 4)}****`);

        // Request pairing code - this will initialize socket and wait for code
        const pairingCode = await this.bot.requestPairingCode(cleanNumber);

        this.addActivity('success', `Pairing code generated: ${pairingCode}`);

        // Emit to connected dashboard clients
        this.io.emit('pairing-code', { 
          phoneNumber: cleanNumber.slice(0, 4) + '****', 
          pairingCode,
          expiresIn: 300,
        });

        res.json({
          success: true,
          pairingCode,
          expiresIn: 300, // 5 minutes
          message: 'Pairing code generated successfully. Enter this code in WhatsApp within 5 minutes.',
          instructions: [
            'Open WhatsApp on your phone',
            'Go to Settings > Linked Devices',
            'Tap "Link a Device"',
            'When prompted, select "Link with phone number instead"',
            'Enter the pairing code shown above',
          ],
        });

      } catch (error) {
        Logger.error('Pairing endpoint error', error);
        this.addActivity('error', `Pairing failed: ${error.message}`);
        
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to generate pairing code. Please try again.',
          hint: 'Make sure the phone number includes country code and WhatsApp is installed on that number.',
        });
      }
    });

    // Disconnect endpoint
    this.app.post('/api/disconnect', async (req, res) => {
      try {
        await this.bot.disconnect();
        this.addActivity('disconnect', 'Bot disconnected');
        this.io.emit('status', { state: 'disconnected' });
        
        res.json({
          success: true,
          message: 'Bot disconnected successfully',
        });
      } catch (error) {
        Logger.error('Disconnect error', error);
        res.status(500).json({
          success: false,
          message: 'Failed to disconnect',
        });
      }
    });

    // Get available commands
    this.app.get('/api/commands', (req, res) => {
      try {
        const commands = this.bot.commandHandler?.getCommands() || [];
        res.json({
          success: true,
          commands: commands.map((cmd) => ({
            name: cmd.name,
            description: cmd.description || 'No description',
            usage: cmd.usage || `${config.bot.prefix}${cmd.name}`,
            category: cmd.category || 'general',
            aliases: cmd.aliases || [],
            ownerOnly: cmd.ownerOnly || false,
          })),
        });
      } catch (error) {
        Logger.error('Commands endpoint error', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get commands',
        });
      }
    });

    // Get activity log
    this.app.get('/api/activity', (req, res) => {
      res.json({
        success: true,
        activities: this.activityLog.slice(-50),
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      Logger.error('Unhandled error', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      Logger.info(`Dashboard connected: ${socket.id}`);
      this.addActivity('dashboard', 'Dashboard client connected');

      // Send current status immediately
      const status = this.bot.getStatus();
      socket.emit('status', {
        state: status.connectionState,
        connected: status.connected,
        stats: status.stats,
        bot: status.botInfo,
      });

      // Send recent activity
      socket.emit('activity-log', this.activityLog.slice(-20));

      // Handle status request
      socket.on('get-status', () => {
        const status = this.bot.getStatus();
        socket.emit('status', {
          state: status.connectionState,
          connected: status.connected,
          stats: status.stats,
          bot: status.botInfo,
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        Logger.info(`Dashboard disconnected: ${socket.id}`);
      });
    });

    // Emit status updates periodically
    setInterval(() => {
      const status = this.bot.getStatus();
      this.io.emit('status', {
        state: status.connectionState,
        connected: status.connected,
        stats: status.stats,
        uptime: this.bot.getUptime(),
      });
    }, 5000);
  }

  setupBotEvents() {
    // Forward bot events to dashboard
    this.bot.on('connection', (update) => {
      Logger.info('Bot connection update:', update.state);
      this.addActivity('connection', `Connection state: ${update.state}`);
      this.io.emit('connection-update', update);
    });

    this.bot.on('pairing-code', ({ phoneNumber, code }) => {
      this.io.emit('pairing-code', { phoneNumber, pairingCode: code });
    });

    this.bot.on('pairing-error', (error) => {
      this.addActivity('error', `Pairing error: ${error.message}`);
      this.io.emit('pairing-error', { message: error.message });
    });

    this.bot.on('qr', (qr) => {
      this.addActivity('qr', 'QR code generated');
      this.io.emit('qr', qr);
    });

    this.bot.on('message', (message) => {
      const from = message.key.remoteJid?.split('@')[0]?.slice(0, 6) + '****';
      this.addActivity('message', `Message from ${from}`);
    });
  }

  addActivity(type, message) {
    const activity = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    
    this.activityLog.push(activity);
    
    // Keep only last 100 activities
    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(-100);
    }

    // Emit to connected clients
    this.io.emit('activity', activity);
  }

  async start(skipBotInit = false) {
    try {
      // Start server first
      this.server.listen(config.server.port, () => {
        Logger.success(`API Server running on port ${config.server.port}`);
        Logger.info(`Dashboard URL: ${config.server.dashboardUrl}`);
        Logger.info('Waiting for pairing or existing session...');
        this.addActivity('server', `Server started on port ${config.server.port}`);
      });

      // Try to initialize bot with existing session
      if (!skipBotInit) {
        try {
          await this.bot.initialize(null, false);
        } catch (error) {
          Logger.warn('No existing session or connection failed. Waiting for pairing request.');
        }
      }

    } catch (error) {
      Logger.error('Failed to start server', error);
      process.exit(1);
    }
  }
}

module.exports = ApiServer;
