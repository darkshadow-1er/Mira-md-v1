const axios = require('axios');
const config = require('../config/config');

module.exports = {
  name: 'translate',
  description: 'Translate text to another language',
  usage: '!translate <lang> <text>',
  category: 'utility',
  aliases: ['tr', 'trans'],
  cooldown: 3000,

  async execute({ args, reply, react }) {
    if (args.length < 2) {
      return reply(`🌐 *Translate Command*

Usage: !translate <language_code> <text>

Examples:
• !translate es Hello world
• !translate fr How are you?
• !translate de Good morning

Common language codes:
• en - English
• es - Spanish
• fr - French
• de - German
• it - Italian
• pt - Portuguese
• ru - Russian
• ja - Japanese
• ko - Korean
• zh - Chinese
• ar - Arabic
• hi - Hindi`);
    }

    const targetLang = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    await react('🌐');

    try {
      // Using free translation API (LibreTranslate or similar)
      // For production, use Google Translate API or similar
      const response = await axios.post(
        'https://api.mymemory.translated.net/get',
        null,
        {
          params: {
            q: text,
            langpair: `en|${targetLang}`,
          },
          timeout: 10000,
        }
      );

      const translation = response.data.responseData?.translatedText;

      if (translation && translation !== text) {
        await reply(`🌐 *Translation*

📝 *Original:*
${text}

🔄 *Translated (${targetLang.toUpperCase()}):*
${translation}`);
      } else {
        await reply('❌ Translation failed or language not supported.');
      }
    } catch (error) {
      await react('❌');
      await reply(`❌ Translation Error: ${error.message}`);
    }
  },
};
