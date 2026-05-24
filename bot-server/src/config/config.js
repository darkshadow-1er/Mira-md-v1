require('dotenv').config();

module.exports = {
  // Environment
  env: process.env.NODE_ENV || 'development',

  // Bot Configuration
  bot: {
    name: process.env.BOT_NAME || 'MIRA-MD',
    version: process.env.BOT_VERSION || '1.0.0',
    prefix: process.env.BOT_PREFIX || '!',
    owner: process.env.OWNER_NUMBER || '',
    sessionName: process.env.SESSION_NAME || 'mira_session',
    debug: process.env.DEBUG_MODE === 'true',
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
    // Allow multiple dashboard origins (comma-separated)
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  },

  // API Keys
  api: {
    openai: process.env.OPENAI_API_KEY || '',
    weather: process.env.WEATHER_API_KEY || '',
    translate: process.env.TRANSLATE_API_KEY || '',
  },

  // Database
  database: {
    mongoUri: process.env.MONGODB_URI || '',
  },

  // Auto Update
  update: {
    githubRepo: process.env.GITHUB_REPO || '',
    enabled: process.env.ENABLE_AUTO_UPDATE === 'true',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
  },

  // Command Cooldowns (milliseconds)
  cooldowns: {
    default: 3000,
    ai: 5000,
    admin: 1000,
  },

  // Session Paths
  paths: {
    sessions: './sessions',
    logs: './logs',
    temp: './temp',
  },
};
