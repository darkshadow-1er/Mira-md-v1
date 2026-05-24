const axios = require('axios');
const config = require('../config/config');

module.exports = {
  name: 'weather',
  description: 'Get weather information for a city',
  usage: '!weather <city>',
  category: 'utility',
  aliases: ['w', 'forecast'],
  cooldown: 5000,

  async execute({ args, reply, react }) {
    const city = args.join(' ');

    if (!city) {
      return reply(`🌤️ *Weather Command*

Please specify a city name.

Usage: !weather <city>
Example: !weather New York`);
    }

    if (!config.api.weather) {
      return reply('❌ Weather feature is not configured. Please set WEATHER_API_KEY in environment variables.');
    }

    await react('🌤️');

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: city,
            appid: config.api.weather,
            units: 'metric',
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      const weather = data.weather[0];
      const main = data.main;
      const wind = data.wind;

      const weatherEmoji = {
        Clear: '☀️',
        Clouds: '☁️',
        Rain: '🌧️',
        Drizzle: '🌦️',
        Thunderstorm: '⛈️',
        Snow: '❄️',
        Mist: '🌫️',
        Fog: '🌫️',
      };

      const emoji = weatherEmoji[weather.main] || '🌍';

      await reply(`${emoji} *Weather in ${data.name}, ${data.sys.country}*

🌡️ *Temperature:* ${main.temp}°C
🤚 *Feels Like:* ${main.feels_like}°C
💧 *Humidity:* ${main.humidity}%
🌬️ *Wind:* ${wind.speed} m/s
📊 *Pressure:* ${main.pressure} hPa
☁️ *Conditions:* ${weather.description}

🕐 *Last Updated:* ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      await react('❌');

      if (error.response?.status === 404) {
        await reply(`❌ City "${city}" not found. Please check the spelling.`);
      } else if (error.response?.status === 401) {
        await reply('❌ Invalid API key. Please check configuration.');
      } else {
        await reply(`❌ Weather Error: ${error.message}`);
      }
    }
  },
};
