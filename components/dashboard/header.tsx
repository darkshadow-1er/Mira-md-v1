'use client'

import { Activity, Bot, Github, Terminal } from 'lucide-react'

interface HeaderProps {
  status: 'connected' | 'disconnected' | 'connecting'
  uptime?: string
}

export function Header({ status, uptime }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-border">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                status === 'connected' ? 'bg-neon-green status-pulse' : 
                status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-destructive'
              }`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">MIRA-MD</span>
              </h1>
              <p className="text-xs text-muted-foreground tracking-wider uppercase">
                WhatsApp Multi-Device
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">STATUS:</span>
              <span className={`font-medium ${
                status === 'connected' ? 'text-neon-green' : 
                status === 'connecting' ? 'text-yellow-500' : 'text-destructive'
              }`}>
                {status.toUpperCase()}
              </span>
            </div>
            {uptime && (
              <div className="flex items-center gap-2 text-sm">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">UPTIME:</span>
                <span className="font-medium text-foreground">{uptime}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all"
              aria-label="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
