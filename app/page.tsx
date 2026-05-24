'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/dashboard/header'
import { PairingForm } from '@/components/dashboard/pairing-form'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { CommandList } from '@/components/dashboard/command-list'
import { ActivityLog } from '@/components/dashboard/activity-log'
import { GridBackground } from '@/components/dashboard/grid-background'
import { Server, Shield, Cpu, Layers } from 'lucide-react'

// Sample commands data - this would come from the bot server
const sampleCommands = [
  { name: 'ping', description: 'Check bot latency and status', usage: '!ping', category: 'utility' },
  { name: 'help', description: 'Display available commands', usage: '!help [command]', category: 'info' },
  { name: 'menu', description: 'Show interactive menu', usage: '!menu', category: 'info' },
  { name: 'ai', description: 'Chat with AI assistant', usage: '!ai <prompt>', category: 'ai' },
  { name: 'translate', description: 'Translate text to another language', usage: '!translate <lang> <text>', category: 'utility' },
  { name: 'weather', description: 'Get weather information', usage: '!weather <city>', category: 'utility' },
  { name: 'meme', description: 'Get a random meme', usage: '!meme', category: 'fun' },
  { name: 'admin', description: 'Admin panel access', usage: '!admin', category: 'admin' },
  { name: 'ban', description: 'Ban a user from using the bot', usage: '!ban @user', category: 'admin' },
  { name: 'update', description: 'Update bot from GitHub', usage: '!update', category: 'admin' },
]

// Sample activity logs
const sampleLogs = [
  { id: '1', type: 'success' as const, content: 'Bot connected successfully', timestamp: '2 minutes ago' },
  { id: '2', type: 'message' as const, content: 'Processed message from +1234567890', timestamp: '5 minutes ago' },
  { id: '3', type: 'command' as const, content: 'Executed !ping command', timestamp: '8 minutes ago' },
  { id: '4', type: 'connection' as const, content: 'New user paired: +0987654321', timestamp: '15 minutes ago' },
]

export default function Dashboard() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [stats, setStats] = useState({
    messagesProcessed: 0,
    activeUsers: 0,
    commandsExecuted: 0,
    uptime: '0h 0m',
  })
  const [logs, setLogs] = useState(sampleLogs)

  // Check bot status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status')
        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
          if (data.stats) {
            setStats(data.stats)
          }
        }
      } catch {
        // API not available yet, keep disconnected status
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handlePairingSuccess = (phoneNumber: string) => {
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        type: 'connection',
        content: `Pairing code generated for ${phoneNumber}`,
        timestamp: 'Just now',
      },
      ...prev,
    ])
    setStatus('connecting')
  }

  const features = [
    {
      icon: Server,
      title: 'Multi-Device Support',
      description: 'Connect multiple WhatsApp devices simultaneously with Baileys MD',
    },
    {
      icon: Shield,
      title: 'Secure Pairing',
      description: 'Industry-standard authentication with pairing codes',
    },
    {
      icon: Cpu,
      title: 'Modular Commands',
      description: 'Dynamic plugin system for easy command management',
    },
    {
      icon: Layers,
      title: 'Auto Updates',
      description: 'Keep your bot updated with the latest features',
    },
  ]

  return (
    <div className="min-h-screen">
      <GridBackground />
      <Header status={status} uptime={stats.uptime} />

      <main className="container mx-auto px-6 py-10">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Production Ready</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="gradient-text">WhatsApp Bot</span>
            <br />
            <span className="text-foreground">Control Center</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Deploy your WhatsApp bot in seconds. Connect, manage, and monitor your bot
            with our futuristic dashboard interface.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="mb-10">
          <StatsGrid stats={stats} />
        </section>

        {/* Main Content Grid */}
        <section className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Pairing Form */}
          <div>
            <PairingForm onPairingSuccess={handlePairingSuccess} />
          </div>

          {/* Activity Log */}
          <div>
            <ActivityLog logs={logs} />
          </div>
        </section>

        {/* Commands Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Available Commands</h2>
            <p className="text-muted-foreground">
              Explore the built-in commands available in MIRA-MD
            </p>
          </div>
          <CommandList commands={sampleCommands} />
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Core Features</h2>
            <p className="text-muted-foreground">
              Built with modern technologies for maximum reliability
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6 card-hover"
              >
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bot Server Info */}
        <section className="bg-card/30 backdrop-blur-xl border border-border rounded-xl p-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Deploy Your Own Bot Server</h2>
            <p className="text-muted-foreground mb-6">
              The bot server runs separately from this dashboard. Download the complete Node.js bot
              package to run on your server or VPS.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/api/download-bot"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all glow-box"
              >
                Download Bot Package
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary border border-border text-foreground font-semibold hover:bg-secondary/80 transition-all"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="gradient-text font-bold">MIRA-MD</span>
              <span className="text-muted-foreground text-sm">v1.0.0</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Baileys Multi-Device API
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
