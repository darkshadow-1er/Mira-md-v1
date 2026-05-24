const axios = require('axios');

module.exports = {
  name: 'meme',
  description: 'Get a random meme',
  usage: '!meme',
  category: 'fun',
  aliases: ['randommeme', 'funny'],
  cooldown: 5000,

  async execute({ reply, react, socket, jid }) {
    await react('😂');

    try {
      const response = await axios.get('https://meme-api.com/gimme', {
        timeout: 10000,
      });

      const meme = response.data;

      if (meme.nsfw) {
        // Skip NSFW content, fetch another
        return this.execute({ reply, react, socket, jid });
      }

      // Send image with caption
      await socket.sendMessage(jid, {
        image: { url: meme.url },
        caption: `😂 *${meme.title}*\n\n👍 ${meme.ups} upvotes\n📁 r/${meme.subreddit}`,
      });
    } catch (error) {
      await react('❌');
      await reply(`❌ Failed to fetch meme: ${error.message}`);
    }
  },
};
