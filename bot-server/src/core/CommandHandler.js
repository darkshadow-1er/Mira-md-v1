const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const Logger = require('../utils/logger');

class CommandHandler {
  constructor(socket) {
    this.socket = socket;
    this.commands = new Map();
    this.cooldowns = new Map();
    this.loadCommands();
  }

  loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');

    // Ensure commands directory exists
    if (!fs.existsSync(commandsPath)) {
      fs.mkdirSync(commandsPath, { recursive: true });
      Logger.warn('Commands directory created. Add command files to enable features.');
      return;
    }

    // Load all command files
    const files = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

    for (const file of files) {
      try {
        const filePath = path.join(commandsPath, file);
        
        // Clear cache for hot reloading
        delete require.cache[require.resolve(filePath)];
        
        const command = require(filePath);

        if (command.name) {
          this.commands.set(command.name.toLowerCase(), command);
          
          // Register aliases
          if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              this.commands.set(alias.toLowerCase(), command);
            }
          }
          
          Logger.info(`Loaded command: ${command.name}`);
        }
      } catch (error) {
        Logger.error(`Failed to load command ${file}`, error);
      }
    }

    Logger.success(`Loaded ${this.commands.size} commands`);
  }

  reloadCommands() {
    this.commands.clear();
    this.loadCommands();
    return this.commands.size;
  }

  async handleMessage(message) {
    try {
      const jid = message.key.remoteJid;
      const sender = message.key.participant || message.key.remoteJid;
      const isGroup = jid.endsWith('@g.us');

      // Extract message content
      const content = this.extractMessageContent(message);
      if (!content) return false;

      const prefix = config.bot.prefix;

      // Check if message starts with prefix
      if (!content.startsWith(prefix)) return false;

      // Parse command and arguments
      const args = content.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();

      // Find command
      const command = this.commands.get(commandName);
      if (!command) return false;

      // Check if user is owner for admin commands
      const senderNumber = sender.split('@')[0];
      const isOwner = senderNumber === config.bot.owner;

      if (command.ownerOnly && !isOwner) {
        await this.reply(message, '❌ This command is only available for the bot owner.');
        return true;
      }

      // Check cooldown
      if (this.isOnCooldown(sender, commandName)) {
        await this.reply(message, '⏳ Please wait before using this command again.');
        return true;
      }

      // Set cooldown
      this.setCooldown(sender, commandName, command.cooldown);

      // Log command execution
      Logger.command(commandName, senderNumber, isGroup ? jid : null);

      // Execute command
      await command.execute({
        socket: this.socket,
        message,
        args,
        jid,
        sender,
        senderNumber,
        isGroup,
        isOwner,
        reply: (text) => this.reply(message, text),
        react: (emoji) => this.react(message, emoji),
      });

      return true;
    } catch (error) {
      Logger.error('Error handling command', error);
      return false;
    }
  }

  extractMessageContent(message) {
    const msg = message.message;
    if (!msg) return null;

    return (
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      msg.videoMessage?.caption ||
      msg.documentMessage?.caption ||
      null
    );
  }

  async reply(message, text) {
    try {
      await this.socket.sendMessage(message.key.remoteJid, {
        text,
        quoted: message,
      });
    } catch (error) {
      Logger.error('Failed to send reply', error);
    }
  }

  async react(message, emoji) {
    try {
      await this.socket.sendMessage(message.key.remoteJid, {
        react: {
          text: emoji,
          key: message.key,
        },
      });
    } catch (error) {
      Logger.error('Failed to send reaction', error);
    }
  }

  isOnCooldown(userId, commandName) {
    const key = `${userId}-${commandName}`;
    const cooldownEnd = this.cooldowns.get(key);
    
    if (!cooldownEnd) return false;
    
    if (Date.now() > cooldownEnd) {
      this.cooldowns.delete(key);
      return false;
    }
    
    return true;
  }

  setCooldown(userId, commandName, duration = null) {
    const key = `${userId}-${commandName}`;
    const cooldownTime = duration || config.cooldowns.default;
    this.cooldowns.set(key, Date.now() + cooldownTime);
  }

  getCommands() {
    // Get unique commands (excluding aliases)
    const uniqueCommands = new Map();
    for (const [, command] of this.commands) {
      if (!uniqueCommands.has(command.name)) {
        uniqueCommands.set(command.name, command);
      }
    }
    return Array.from(uniqueCommands.values());
  }
}

module.exports = CommandHandler;
