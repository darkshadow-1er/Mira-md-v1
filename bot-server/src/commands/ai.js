const axios = require('axios');
const config = require('../config/config');

module.exports = {
  name: 'ai',
  description: 'Chat with AI assistant',
  usage: '!ai <your message>',
  category: 'ai',
  aliases: ['ask', 'chat', 'gpt'],
  cooldown: 5000,

  async execute({ args, reply, react }) {
    const prompt = args.join(' ');

    if (!prompt) {
      return reply(`🤖 *AI Assistant*

Please provide a message or question.

Usage: !ai <your message>
Example: !ai What is the capital of France?`);
    }

    if (!config.api.openai) {
      return reply('❌ AI feature is not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    await react('🤔');

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are ${config.bot.name}, a helpful WhatsApp bot assistant. Keep responses concise and friendly.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${config.api.openai}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content;

      if (aiResponse) {
        await react('✅');
        await reply(`🤖 *AI Response*\n\n${aiResponse}`);
      } else {
        await reply('❌ No response from AI. Please try again.');
      }
    } catch (error) {
      await react('❌');
      
      if (error.response?.status === 429) {
        await reply('⏳ Rate limited. Please wait a moment and try again.');
      } else if (error.response?.status === 401) {
        await reply('❌ Invalid API key. Please check configuration.');
      } else {
        await reply(`❌ AI Error: ${error.message}`);
      }
    }
  },
};
