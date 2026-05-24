const { bannedUsers } = require('./admin');

module.exports = {
  name: 'unban',
  description: 'Unban a user',
  usage: '!unban <number>',
  category: 'admin',
  aliases: ['unblock'],
  ownerOnly: true,
  cooldown: 1000,

  async execute({ args, reply, react }) {
    const target = args[0]?.replace(/[^0-9]/g, '');

    if (!target) {
      return reply(`❌ Please specify a phone number to unban.

Usage: !unban <number>
Example: !unban 1234567890`);
    }

    if (!bannedUsers.has(target)) {
      return reply(`⚠️ User ${target} is not banned.`);
    }

    bannedUsers.delete(target);
    await react('✅');
    await reply(`✅ *User Unbanned*

Number: ${target}
Status: Can now use the bot`);
  },
};
