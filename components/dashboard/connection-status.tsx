'use client'

import { Wifi, WifiOff, Loader2, RefreshCw, Server, Cpu, HardDrive } from 'lucide-react'
import { useBotStatus } from '@/hooks/use-bot-status'
import { Button } from '@/components/ui/button'

export function ConnectionStatus() {
  const { status, stats, bot, server, isLoading, error, refetch } = useBotStatus()

  const statusConfig = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/30',
      pulseColor: 'bg-neon-green',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      pulseColor: 'bg-destructive',
    },
    connecting: {
      icon: Loader2,
      label: 'Connecting',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      pulseColor: 'bg-yellow-500',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
              <Icon className={`w-5 h-5 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-semibold">Connection Status</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config.pulseColor} ${status === 'connected' ? 'status-pulse' : ''}`} />
                <span className={`text-sm ${config.color}`}>{config.label}</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="border-border"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Details */}
      <div className="p-5 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Bot Info */}
        {bot && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Server className="w-4 h-4" />
              <span>Bot Info</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-secondary/30">
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{bot.name}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30">
                <span className="text-muted-foreground">Version:</span>
                <span className="ml-2 font-medium">{bot.version}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30">
                <span className="text-muted-foreground">Prefix:</span>
                <span className="ml-2 font-medium font-mono">{bot.prefix}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30">
                <span className="text-muted-foreground">Commands:</span>
                <span className="ml-2 font-medium">{bot.commandsLoaded}</span>
              </div>
            </div>
          </div>
        )}

        {/* Server Info */}
        {server && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="w-4 h-4" />
              <span>Server Info</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-secondary/30">
                <span className="text-muted-foreground">Node:</span>
                <span className="ml-2 font-medium">{server.nodeVersion}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30">
                <span className="text-muted-foreground">Platform:</span>
                <span className="ml-2 font-medium capitalize">{server.platform}</span>
              </div>
            </div>
            {server.memory && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>Memory</span>
                  </div>
                  <span>{server.memory.used}MB / {server.memory.total}MB</span>
                </div>
                <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(server.memory.used / server.memory.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-lg font-bold">{stats.messagesProcessed}</p>
            <p className="text-xs text-muted-foreground">Messages</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-lg font-bold">{stats.commandsExecuted}</p>
            <p className="text-xs text-muted-foreground">Commands</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-lg font-bold">{stats.uptime}</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  )
}
