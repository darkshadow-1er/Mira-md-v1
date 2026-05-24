const config = require('../config/config');

module.exports = {
  name: 'menu',
  description: 'Display interactive menu',
  usage: '!menu',
  category: 'info',
  aliases: ['m', 'start'],
  cooldown: 3000,

  async execute({ reply, senderNumber }) {
    const prefix = config.bot.prefix;
    const now = new Date();
    const hours = now.getHours();
    
    let greeting = 'Good evening';
    if (hours < 12) greeting = 'Good morning';
    else if (hours < 18) greeting = 'Good afternoon';

    let menuText = `╔══════════════════╗
║  🤖 *${config.bot.name}*  ║
╚══════════════════╝

${greeting}! 👋

━━━━━━━━━━━━━━━━━━━

📌 *MAIN MENU*

🔧 *UTILITY*
├ ${prefix}ping - Check latency
├ ${prefix}translate - Translate text
└ ${prefix}weather - Weather info

ℹ️ *INFO*
├ ${prefix}help - Command help
├ ${prefix}menu - This menu
└ ${prefix}info - Bot info

🎮 *FUN*
└ ${prefix}meme - Random meme

🤖 *AI*
└ ${prefix}ai - Chat with AI

👑 *ADMIN* (Owner Only)
├ ${prefix}admin - Admin panel
├ ${prefix}ban - Ban user
├ ${prefix}reload - Reload commands
└ ${prefix}update - Update bot

━━━━━━━━━━━━━━━━━━━

📝 *Prefix:* ${prefix}
📞 *Your Number:* ${senderNumber}
⏰ *Time:* ${now.toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━
Use ${prefix}help <command> for details`;

    await reply(menuText);
  },
};
