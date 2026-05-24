const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const Logger = require('../utils/logger');

const execAsync = promisify(exec);

module.exports = {
  name: 'update',
  description: 'Update bot from GitHub repository',
  usage: '!update',
  category: 'admin',
  aliases: ['upgrade', 'pull'],
  ownerOnly: true, // IMPORTANT: Only owner can use this command
  cooldown: 30000, // 30 seconds cooldown

  async execute({ reply, react, isOwner, senderNumber }) {
    // Double-check owner permission
    if (!isOwner) {
      return reply('❌ This command is restricted to the bot owner only.');
    }

    if (!config.update.enabled) {
      return reply('❌ Auto-update feature is disabled in configuration.');
    }

    await react('🔄');
    await reply('🔄 *Starting update process...*\n\nThis may take a moment.');

    try {
      const projectRoot = path.join(__dirname, '../..');
      
      // Step 1: Check git status
      await reply('📋 Checking repository status...');
      
      const { stdout: gitStatus } = await execAsync('git status --porcelain', {
        cwd: projectRoot,
      });
      
      if (gitStatus.trim()) {
        await reply('⚠️ Warning: There are uncommitted local changes. They will be preserved.');
      }

      // Step 2: Fetch latest changes
      await reply('📥 Fetching latest changes from remote...');
      
      const { stdout: fetchOutput } = await execAsync('git fetch origin', {
        cwd: projectRoot,
      });
      
      // Step 3: Check if there are updates
      const { stdout: diffOutput } = await execAsync('git log HEAD..origin/main --oneline', {
        cwd: projectRoot,
      });
      
      if (!diffOutput.trim()) {
        await react('✅');
        return reply('✅ *Already up to date!*\n\nNo new updates available.');
      }

      // Step 4: Pull changes
      await reply('📦 Pulling latest changes...');
      
      const { stdout: pullOutput } = await execAsync('git pull origin main', {
        cwd: projectRoot,
      });

      // Step 5: Check if package.json changed
      const { stdout: changedFiles } = await execAsync(
        'git diff HEAD~1 --name-only | grep package.json || true',
        { cwd: projectRoot }
      );

      let npmInstallNeeded = changedFiles.includes('package.json');

      // Step 6: Run npm install if needed
      if (npmInstallNeeded) {
        await reply('📦 Installing new dependencies...');
        
        const { stdout: npmOutput } = await execAsync('npm install --production', {
          cwd: projectRoot,
        });
        
        Logger.info('Dependencies updated', { output: npmOutput });
      }

      // Step 7: Log the update
      Logger.success(`Bot updated by owner (${senderNumber})`);

      // Build success message
      let successMessage = '✅ *Update Successful!*\n\n';
      successMessage += `📋 *Changes:*\n${diffOutput.trim().slice(0, 500)}\n\n`;
      
      if (npmInstallNeeded) {
        successMessage += '📦 Dependencies updated\n';
      }
      
      successMessage += '\n🔄 *Restarting bot in 5 seconds...*';
      
      await react('✅');
      await reply(successMessage);

      // Step 8: Schedule restart
      setTimeout(() => {
        Logger.warn('Restarting bot after update...');
        process.exit(0); // Exit with success code, process manager (pm2/systemd) will restart
      }, 5000);

    } catch (error) {
      Logger.error('Update failed', error);
      await react('❌');
      
      let errorMessage = '❌ *Update Failed*\n\n';
      errorMessage += `*Error:* ${error.message}\n\n`;
      errorMessage += 'Please check the logs for more details or update manually.';
      
      await reply(errorMessage);
    }
  },
};
