const config = require('../config/config');
const Logger = require('../utils/logger');

// In-memory ban list (use database in production)
const bannedUsers = new Set();

module.exports = {
  name: 'admin',
  description: 'Admin control panel',
  usage: '!admin <action>',
  category: 'admin',
  aliases: ['adm'],
  ownerOnly: true,
  cooldown: 1000,

  async execute({ args, reply, react, socket }) {
    const action = args[0]?.toLowerCase();

    if (!action) {
      return reply(`👑 *Admin Panel*

Available actions:
• ${config.bot.prefix}admin reload - Reload commands
• ${config.bot.prefix}admin broadcast <msg> - Broadcast message
• ${config.bot.prefix}admin stats - View statistics
• ${config.bot.prefix}admin banlist - View banned users
• ${config.bot.prefix}admin shutdown - Shutdown bot`);
    }

    switch (action) {
      case 'reload': {
        await react('🔄');
        
        try {
          const CommandHandler = require('../core/CommandHandler');
          const handler = new CommandHandler(socket);
          const count = handler.reloadCommands();
          
          await react('✅');
          await reply(`✅ Reloaded ${count} commands successfully!`);
        } catch (error) {
          Logger.error('Failed to reload commands', error);
          await reply(`❌ Failed to reload: ${error.message}`);
        }
        break;
      }

      case 'stats': {
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        
        await reply(`📊 *Bot Statistics*

⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
💾 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
🚫 Banned Users: ${bannedUsers.size}
📱 Connected: ${socket.user ? 'Yes' : 'No'}`);
        break;
      }

      case 'banlist': {
        if (bannedUsers.size === 0) {
          return reply('📋 No banned users.');
        }
        
        const list = Array.from(bannedUsers).join('\n• ');
        await reply(`🚫 *Banned Users*\n\n• ${list}`);
        break;
      }

      case 'broadcast': {
        const message = args.slice(1).join(' ');
        if (!message) {
          return reply('❌ Please provide a message to broadcast.');
        }
        
        await reply(`📢 Broadcast feature requires database integration.`);
        break;
      }

      case 'shutdown': {
        await reply('🛑 Shutting down bot...');
        Logger.warn('Bot shutdown initiated by owner');
        
        setTimeout(() => {
          process.exit(0);
        }, 2000);
        break;
      }

      default:
        await reply(`❌ Unknown action: ${action}`);
    }
  },
};

// Export banned users for use in other commands
module.exports.bannedUsers = bannedUsers;
