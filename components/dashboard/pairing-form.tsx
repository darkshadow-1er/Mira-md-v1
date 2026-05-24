'use client'

import { useState, useEffect } from 'react'
import { Copy, Phone, Loader2, CheckCircle, AlertCircle, Zap, Server, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PairingFormProps {
  onPairingSuccess?: (phoneNumber: string) => void
  botServerUrl?: string
}

type ServerStatus = 'checking' | 'online' | 'offline'

export function PairingForm({ onPairingSuccess, botServerUrl }: PairingFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking')
  const [countdown, setCountdown] = useState<number | null>(null)

  // Check server status on mount
  useEffect(() => {
    checkServerStatus()
  }, [])

  // Countdown timer for pairing code expiry
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [pairingCode])

  const checkServerStatus = async () => {
    setServerStatus('checking')
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setServerStatus(data.success && data.status !== 'disconnected' ? 'online' : 'offline')
    } catch {
      setServerStatus('offline')
    }
  }

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 15
  }

  const formatPhoneNumber = (value: string): string => {
    return value.replace(/\D/g, '')
  }

  const handleGeneratePairingCode = async () => {
    setError(null)
    
    const cleanedNumber = formatPhoneNumber(phoneNumber)
    
    if (!validatePhoneNumber(cleanedNumber)) {
      setError('Enter a valid phone number with country code (10-15 digits)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: cleanedNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.hint || 'Failed to generate pairing code')
      }

      setPairingCode(data.pairingCode)
      setCountdown(data.expiresIn || 300)
      onPairingSuccess?.(phoneNumber)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      
      // Recheck server status on error
      checkServerStatus()
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (pairingCode) {
      await navigator.clipboard.writeText(pairingCode.replace('-', ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetForm = () => {
    setPairingCode(null)
    setPhoneNumber('')
    setError(null)
    setCountdown(null)
  }

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative">
      {/* Decorative Elements */}
      <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30" />

      <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8 glow-border card-hover">
        {/* Server Status Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Connect Your WhatsApp</h2>
              <p className="text-sm text-muted-foreground">Generate pairing code for authentication</p>
            </div>
          </div>
          
          <button 
            onClick={checkServerStatus}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all hover:bg-secondary/50"
            style={{
              borderColor: serverStatus === 'online' ? 'rgb(34 197 94 / 0.5)' : 
                          serverStatus === 'offline' ? 'rgb(239 68 68 / 0.5)' : 
                          'rgb(234 179 8 / 0.5)',
              color: serverStatus === 'online' ? 'rgb(34 197 94)' : 
                     serverStatus === 'offline' ? 'rgb(239 68 68)' : 
                     'rgb(234 179 8)',
            }}
          >
            <Server className="w-3 h-3" />
            {serverStatus === 'checking' && 'Checking...'}
            {serverStatus === 'online' && 'Bot Online'}
            {serverStatus === 'offline' && 'Bot Offline'}
          </button>
        </div>

        {/* Server Offline Warning */}
        {serverStatus === 'offline' && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">Bot Server Not Connected</p>
                <p className="text-muted-foreground mt-1">
                  The bot server must be running on a persistent server (Render, Railway, or VPS) to generate valid pairing codes.
                </p>
                {botServerUrl && (
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Server URL: {botServerUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!pairingCode ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Phone Number (with country code)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="14155551234"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-12 h-14 bg-input/50 border-border text-lg tracking-wider placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Include country code without + (e.g., 1 for US, 44 for UK, 33 for France)
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{error}</p>
                  {error.includes('not reachable') && (
                    <p className="text-xs mt-1 opacity-80">
                      Deploy the bot-server to a persistent host and set BOT_SERVER_URL
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleGeneratePairingCode}
              disabled={loading || !phoneNumber || serverStatus === 'checking'}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-box transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting to WhatsApp...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate Pairing Code
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Pairing codes expire in 5 minutes. Make sure WhatsApp is installed on the target number.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green mb-4">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Code Generated Successfully</span>
              </div>
              
              <div className="mt-4 p-6 rounded-xl bg-background/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Your Pairing Code
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl font-bold tracking-[0.3em] gradient-text">
                    {pairingCode}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all"
                    aria-label="Copy code"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-neon-green" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {countdown !== null && countdown > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Expires in <span className="text-primary font-mono">{formatCountdown(countdown)}</span>
                    </span>
                  </div>
                )}

                {countdown !== null && countdown <= 0 && (
                  <div className="mt-4 text-sm text-destructive">
                    Code expired. Generate a new one.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-sm mb-3">How to Link:</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-mono">1.</span>
                  Open WhatsApp on your phone
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">2.</span>
                  {"Go to Settings > Linked Devices"}
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">3.</span>
                  {"Tap \"Link a Device\""}
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">4.</span>
                  {"Select \"Link with phone number instead\""}
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">5.</span>
                  Enter the pairing code when prompted
                </li>
              </ol>
            </div>

            <Button
              onClick={resetForm}
              variant="outline"
              className="w-full h-12 border-border hover:bg-secondary/50"
            >
              Generate New Code
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
