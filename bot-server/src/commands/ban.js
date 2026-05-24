const { bannedUsers } = require('./admin');

module.exports = {
  name: 'ban',
  description: 'Ban a user from using the bot',
  usage: '!ban <number>',
  category: 'admin',
  aliases: ['block'],
  ownerOnly: true,
  cooldown: 1000,

  async execute({ args, reply, react }) {
    const target = args[0]?.replace(/[^0-9]/g, '');

    if (!target) {
      return reply(`❌ Please specify a phone number to ban.

Usage: !ban <number>
Example: !ban 1234567890`);
    }

    if (bannedUsers.has(target)) {
      return reply(`⚠️ User ${target} is already banned.`);
    }

    bannedUsers.add(target);
    await react('🚫');
    await reply(`🚫 *User Banned*

Number: ${target}
Status: Banned from using bot

Use !unban ${target} to unban.`);
  },
};
