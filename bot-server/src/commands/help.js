const config = require('../config/config');

module.exports = {
  name: 'help',
  description: 'Display available commands',
  usage: '!help [command]',
  category: 'info',
  aliases: ['h', 'commands'],
  cooldown: 3000,

  async execute({ args, reply, socket }) {
    const prefix = config.bot.prefix;
    
    // If specific command requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const CommandHandler = require('../core/CommandHandler');
      const handler = new CommandHandler(socket);
      const command = handler.commands.get(commandName);
      
      if (command) {
        let helpText = `📖 *Command: ${command.name}*\n\n`;
        helpText += `📝 *Description:* ${command.description || 'No description'}\n`;
        helpText += `🔧 *Usage:* ${command.usage || prefix + command.name}\n`;
        helpText += `📁 *Category:* ${command.category || 'general'}\n`;
        
        if (command.aliases && command.aliases.length > 0) {
          helpText += `🔗 *Aliases:* ${command.aliases.join(', ')}\n`;
        }
        
        if (command.ownerOnly) {
          helpText += `⚠️ *Owner Only Command*`;
        }
        
        return reply(helpText);
      } else {
        return reply(`❌ Command "${commandName}" not found. Use ${prefix}help to see all commands.`);
      }
    }
    
    // Show all commands grouped by category
    const categories = {
      utility: [],
      info: [],
      fun: [],
      ai: [],
      admin: [],
      general: [],
    };
    
    const CommandHandler = require('../core/CommandHandler');
    const handler = new CommandHandler(socket);
    const commands = handler.getCommands();
    
    for (const cmd of commands) {
      const category = cmd.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd);
    }
    
    let helpText = `🤖 *${config.bot.name} Commands*\n`;
    helpText += `━━━━━━━━━━━━━━━\n\n`;
    helpText += `*Prefix:* ${prefix}\n\n`;
    
    for (const [category, cmds] of Object.entries(categories)) {
      if (cmds.length === 0) continue;
      
      helpText += `📁 *${category.toUpperCase()}*\n`;
      for (const cmd of cmds) {
        helpText += `  • ${prefix}${cmd.name} - ${cmd.description || 'No description'}\n`;
      }
      helpText += `\n`;
    }
    
    helpText += `━━━━━━━━━━━━━━━\n`;
    helpText += `Use ${prefix}help <command> for detailed info`;
    
    await reply(helpText);
  },
};
