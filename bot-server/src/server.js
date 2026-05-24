const ApiServer = require('./server/ApiServer');
const Logger = require('./utils/logger');
const config = require('./config/config');

async function main() {
  Logger.info('='.repeat(50));
  Logger.info(`Starting ${config.bot.name} API Server...`);
  Logger.info('='.repeat(50));

  const server = new ApiServer();

  try {
    await server.start();

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      Logger.warn(`Received ${signal}. Shutting down...`);
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
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

main();
