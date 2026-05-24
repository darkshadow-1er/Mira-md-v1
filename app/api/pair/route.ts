import { NextRequest, NextResponse } from 'next/server'

/**
 * IMPORTANT: This route proxies requests to the external bot server.
 * 
 * Baileys requires persistent WebSocket connections which Vercel's 
 * serverless functions cannot support. The pairing code MUST be 
 * generated on a persistent Node.js server (Render, Railway, VPS, etc.)
 * 
 * Set BOT_SERVER_URL environment variable to your deployed bot server URL.
 */

const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:3001'

// Simple rate limiting (backup in case bot server is unreachable)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT = 3
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

function validatePhoneNumber(phone: string): { valid: boolean; error?: string; cleaned: string } {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length < 10) {
    return { 
      valid: false, 
      error: 'Phone number too short. Include country code (e.g., 14155551234 for US)',
      cleaned 
    }
  }
  
  if (cleaned.length > 15) {
    return { 
      valid: false, 
      error: 'Phone number too long. Maximum 15 digits.',
      cleaned 
    }
  }

  return { valid: true, cleaned }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many pairing requests. Please wait 5 minutes before trying again.',
          retryAfter: 300
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { number } = body

    // Validate phone number
    if (!number) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    const validation = validatePhoneNumber(number)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      )
    }

    // Forward request to external bot server
    const response = await fetch(`${BOT_SERVER_URL}/api/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number: validation.cleaned }),
    })

    const data = await response.json()

    // Return response from bot server
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Pairing proxy error:', error)
    
    // Check if bot server is unreachable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Bot server is not reachable. Please ensure the bot server is running.',
          hint: 'The bot server should be deployed on Render, Railway, or a VPS - not on Vercel.',
          serverUrl: BOT_SERVER_URL,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to generate pairing code. Please try again.' },
      { status: 500 }
    )
  }
}

// Also support GET for health check
export async function GET() {
  try {
    const response = await fetch(`${BOT_SERVER_URL}/api/health`)
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Pairing endpoint is ready',
      botServerStatus: data.status || 'unknown',
      botServerUrl: BOT_SERVER_URL,
    })
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Bot server is not reachable',
      botServerUrl: BOT_SERVER_URL,
      hint: 'Ensure BOT_SERVER_URL environment variable is set to your deployed bot server.',
    }, { status: 503 })
  }
}
