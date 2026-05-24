const os = require('os');
const config = require('../config/config');

module.exports = {
  name: 'info',
  description: 'Display bot system information',
  usage: '!info',
  category: 'info',
  aliases: ['botinfo', 'stats', 'status'],
  cooldown: 5000,

  async execute({ reply, socket }) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const formatBytes = (bytes) => {
      const mb = bytes / 1024 / 1024;
      return mb.toFixed(2) + ' MB';
    };

    const botUser = socket.user || {};

    let infoText = `🤖 *${config.bot.name} Bot Info*\n`;
    infoText += `━━━━━━━━━━━━━━━━━━━\n\n`;

    infoText += `📱 *Bot Details*\n`;
    infoText += `  • Name: ${config.bot.name}\n`;
    infoText += `  • Version: 1.0.0\n`;
    infoText += `  • Prefix: ${config.bot.prefix}\n`;
    infoText += `  • Number: ${botUser.id?.split(':')[0] || 'N/A'}\n\n`;

    infoText += `⏱️ *Uptime*\n`;
    infoText += `  • ${days}d ${hours}h ${minutes}m ${seconds}s\n\n`;

    infoText += `💾 *Memory Usage*\n`;
    infoText += `  • Heap Used: ${formatBytes(memUsage.heapUsed)}\n`;
    infoText += `  • Heap Total: ${formatBytes(memUsage.heapTotal)}\n`;
    infoText += `  • RSS: ${formatBytes(memUsage.rss)}\n\n`;

    infoText += `🖥️ *System*\n`;
    infoText += `  • Platform: ${os.platform()}\n`;
    infoText += `  • Node.js: ${process.version}\n`;
    infoText += `  • CPU: ${os.cpus()[0]?.model || 'N/A'}\n`;
    infoText += `  • Total RAM: ${formatBytes(totalMem)}\n`;
    infoText += `  • Free RAM: ${formatBytes(freeMem)}\n\n`;

    infoText += `━━━━━━━━━━━━━━━━━━━\n`;
    infoText += `Powered by Baileys Multi-Device`;

    await reply(infoText);
  },
};
