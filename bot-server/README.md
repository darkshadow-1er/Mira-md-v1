# MIRA-MD WhatsApp Bot

A production-ready WhatsApp Multi-Device bot using Baileys with a modular command system, pairing code authentication, and auto-update functionality.

## IMPORTANT: Architecture

**Baileys requires persistent WebSocket connections.** This means:

- The bot server **CANNOT** run on Vercel or any serverless platform
- You must deploy the bot server to a **persistent host** like:
  - **Render** (recommended)
  - **Railway**
  - **Northflank**
  - **VPS** (DigitalOcean, Linode, etc.)
  - **Your own server**

```
┌──────────────────────┐      ┌─────────────────────────┐
│   Vercel (Frontend)  │      │  Render/Railway/VPS     │
│                      │      │                         │
│  Next.js Dashboard   │─────▶│  Node.js Bot Server     │
│  - UI Only           │ API  │  - Baileys Connection   │
│  - Proxy to backend  │      │  - Pairing Codes        │
│                      │      │  - Message Handling     │
└──────────────────────┘      └─────────────────────────┘
```

## Features

- **Multi-Device Support**: Uses Baileys MD for reliable WhatsApp Web connections
- **Pairing Code Authentication**: Connect via phone number instead of QR code
- **Modular Commands**: Easy-to-add plugin-style command system
- **Auto-Update**: Update bot from GitHub with a single command
- **API Server**: RESTful API for dashboard integration
- **Real-time Status**: Socket.IO for live status updates
- **Rate Limiting**: Built-in protection against abuse
- **Owner-Only Commands**: Secure admin functionality

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git (for auto-update feature)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mira-md-bot.git
   cd mira-md-bot/bot-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start the bot**
   ```bash
   # Run bot only (QR/Pairing in terminal)
   npm start
   
   # Run with API server (for dashboard integration)
   npm run server
   ```

## Configuration

Edit `.env` file:

```env
# Bot Settings
BOT_NAME=MIRA-MD
BOT_PREFIX=!
OWNER_NUMBER=1234567890  # Your phone number (required for admin commands)

# Server Settings  
PORT=3001  # Render/Railway will set this automatically
DASHBOARD_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Optional API Keys
OPENAI_API_KEY=sk-xxx    # For AI command
WEATHER_API_KEY=xxx      # For weather command

# Auto Update
GITHUB_REPO=https://github.com/yourusername/mira-md-bot
ENABLE_AUTO_UPDATE=true
```

## Vercel Frontend Setup

Set this environment variable on Vercel:

```env
BOT_SERVER_URL=https://your-bot.onrender.com
```

This tells the frontend where to proxy pairing requests.

## Project Structure

```
bot-server/
├── src/
│   ├── commands/        # Command modules
│   │   ├── ping.js
│   │   ├── help.js
│   │   ├── menu.js
│   │   ├── info.js
│   │   ├── ai.js
│   │   ├── weather.js
│   │   ├── translate.js
│   │   ├── meme.js
│   │   ├── admin.js
│   │   ├── ban.js
│   │   ├── unban.js
│   │   └── update.js    # Auto-update command
│   ├── config/
│   │   └── config.js    # Configuration loader
│   ├── core/
│   │   ├── Bot.js       # Main bot class
│   │   └── CommandHandler.js
│   ├── server/
│   │   └── ApiServer.js # Express + Socket.IO server
│   ├── utils/
│   │   └── logger.js    # Logging utility
│   ├── index.js         # Bot entry point
│   └── server.js        # API server entry point
├── sessions/            # WhatsApp session data (auto-created)
├── logs/               # Log files (auto-created)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Commands

### Utility
- `!ping` - Check bot latency
- `!translate <lang> <text>` - Translate text
- `!weather <city>` - Get weather info

### Info
- `!help [command]` - Show help
- `!menu` - Interactive menu
- `!info` - Bot system info

### Fun
- `!meme` - Get random meme

### AI
- `!ai <prompt>` - Chat with AI

### Admin (Owner Only)
- `!admin` - Admin panel
- `!ban <number>` - Ban user
- `!unban <number>` - Unban user
- `!update` - Update from GitHub

## Adding New Commands

Create a file in `src/commands/`:

```javascript
module.exports = {
  name: 'example',
  description: 'Example command',
  usage: '!example <args>',
  category: 'utility',
  aliases: ['ex'],
  ownerOnly: false,  // Set to true for admin commands
  cooldown: 3000,    // Cooldown in milliseconds

  async execute({ socket, message, args, reply, react, isOwner }) {
    await react('✅');
    await reply('Hello from example command!');
  },
};
```

## API Endpoints

When running with `npm run server`:

- `GET /api/health` - Health check
- `GET /api/status` - Bot status and stats
- `POST /api/pair` - Generate pairing code
- `GET /api/commands` - List available commands

## Auto-Update Feature

The `!update` command (owner only):

1. Pulls latest changes from GitHub
2. Installs new dependencies if package.json changed
3. Restarts the bot automatically

**Requirements:**
- Bot must be in a git repository
- `ENABLE_AUTO_UPDATE=true` in .env
- Only the owner can execute this command

## Deployment

### Render (Recommended)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm run server`
5. Add environment variables from `.env.example`
6. Deploy!

### Railway

1. Create new project from GitHub
2. Add environment variables
3. Railway auto-detects Node.js and deploys

### PM2 (VPS)
```bash
npm install -g pm2
pm2 start src/server.js --name mira-bot
pm2 save
```

### Systemd
Create `/etc/systemd/system/mira-bot.service`:
```ini
[Unit]
Description=MIRA-MD WhatsApp Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/bot-server
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Security Notes

- Never share your session files
- Keep `.env` secure and never commit it
- Only trusted users should have owner access
- Use rate limiting in production
- Consider running behind a reverse proxy

## License

MIT License
