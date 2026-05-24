const fs = require('fs');
const path = require('path');
const pino = require('pino');

const logsDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create pino logger
const logger = pino({
  level: process.env.DEBUG_MODE === 'true' ? 'debug' : 'info',
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: {
          destination: path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`),
        },
        level: 'info',
      },
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
        level: process.env.DEBUG_MODE === 'true' ? 'debug' : 'info',
      },
    ],
  },
});

// Helper methods for formatted logging
const Logger = {
  info: (message, data = {}) => {
    logger.info(data, `[INFO] ${message}`);
  },

  success: (message, data = {}) => {
    logger.info(data, `[SUCCESS] ${message}`);
  },

  warn: (message, data = {}) => {
    logger.warn(data, `[WARN] ${message}`);
  },

  error: (message, error = null) => {
    if (error instanceof Error) {
      logger.error({ err: error }, `[ERROR] ${message}`);
    } else {
      logger.error(`[ERROR] ${message}`);
    }
  },

  debug: (message, data = {}) => {
    logger.debug(data, `[DEBUG] ${message}`);
  },

  command: (command, user, group = null) => {
    logger.info(
      { command, user, group },
      `[COMMAND] ${command} executed by ${user}${group ? ` in ${group}` : ''}`
    );
  },
};

module.exports = Logger;
