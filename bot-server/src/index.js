const Bot = require('./core/Bot');
const Logger = require('./utils/logger');
const config = require('./config/config');

async function main() {
  Logger.info('='.repeat(50));
  Logger.info(`Starting ${config.bot.name} Bot...`);
  Logger.info('='.repeat(50));

  const bot = new Bot();

  try {
    await bot.initialize();

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      Logger.warn(`Received ${signal}. Shutting down...`);
      await bot.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled Rejection', reason);
    });

  } catch (error) {
    Logger.error('Failed to start bot', error);
    process.exit(1);
  }
}

main();
