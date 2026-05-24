module.exports = {
  name: 'ping',
  description: 'Check bot latency and status',
  usage: '!ping',
  category: 'utility',
  aliases: ['p', 'latency'],
  cooldown: 3000,

  async execute({ reply, react }) {
    const start = Date.now();
    
    await react('🏓');
    
    const latency = Date.now() - start;
    
    await reply(`🏓 *PONG!*

⚡ *Latency:* ${latency}ms
📊 *Status:* Online
🤖 *Bot:* Ready`);
  },
};
