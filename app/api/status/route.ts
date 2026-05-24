import { NextResponse } from 'next/server'

/**
 * Status endpoint that proxies to the external bot server.
 * Set BOT_SERVER_URL environment variable to your deployed bot server URL.
 */

const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:3001'

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BOT_SERVER_URL}/api/status`, {
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Bot server returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data,
      serverType: 'proxy',
    })

  } catch (error) {
    console.error('Status proxy error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'disconnected',
      connected: false,
      message: 'Bot server is not reachable',
      serverUrl: BOT_SERVER_URL,
      stats: {
        messagesProcessed: 0,
        activeUsers: 0,
        commandsExecuted: 0,
        uptime: '0m 0s',
      },
      bot: {
        name: 'MIRA-MD',
        version: '1.0.0',
        prefix: '!',
        commandsLoaded: 0,
      },
      hint: 'Deploy the bot-server folder to Render/Railway/VPS and set BOT_SERVER_URL environment variable',
    })
  }
}
