'use client'

import { MessageSquare, Users, Cpu, Clock, TrendingUp, Zap } from 'lucide-react'

interface StatsGridProps {
  stats: {
    messagesProcessed: number
    activeUsers: number
    commandsExecuted: number
    uptime: string
  }
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statItems = [
    {
      label: 'Messages Processed',
      value: stats.messagesProcessed.toLocaleString(),
      icon: MessageSquare,
      change: '+12%',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    {
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      change: '+5%',
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/10',
      borderColor: 'border-neon-green/30',
    },
    {
      label: 'Commands Executed',
      value: stats.commandsExecuted.toLocaleString(),
      icon: Zap,
      change: '+18%',
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      borderColor: 'border-chart-4/30',
    },
    {
      label: 'System Uptime',
      value: stats.uptime,
      icon: Clock,
      change: '99.9%',
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      borderColor: 'border-chart-3/30',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="relative bg-card/50 backdrop-blur-xl border border-border rounded-xl p-5 card-hover overflow-hidden"
        >
          {/* Background Decoration */}
          <div className={`absolute top-0 right-0 w-20 h-20 ${item.bgColor} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-50`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${item.bgColor} border ${item.borderColor}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="flex items-center gap-1 text-xs text-neon-green">
                <TrendingUp className="w-3 h-3" />
                <span>{item.change}</span>
              </div>
            </div>
            
            <div>
              <p className="text-2xl font-bold tracking-tight">{item.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {item.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
