'use client'

import { Activity, MessageSquare, UserPlus, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

interface LogEntry {
  id: string
  type: 'message' | 'connection' | 'command' | 'error' | 'success'
  content: string
  timestamp: string
}

interface ActivityLogProps {
  logs: LogEntry[]
}

const logIcons = {
  message: MessageSquare,
  connection: UserPlus,
  command: Zap,
  error: AlertTriangle,
  success: CheckCircle,
}

const logColors = {
  message: 'text-primary bg-primary/10 border-primary/30',
  connection: 'text-neon-green bg-neon-green/10 border-neon-green/30',
  command: 'text-chart-4 bg-chart-4/10 border-chart-4/30',
  error: 'text-destructive bg-destructive/10 border-destructive/30',
  success: 'text-neon-green bg-neon-green/10 border-neon-green/30',
}

export function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-green/10 border border-neon-green/30">
            <Activity className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="font-semibold">Activity Log</h3>
            <p className="text-xs text-muted-foreground">Real-time bot activity</p>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="max-h-[300px] overflow-y-auto">
        {logs.length > 0 ? (
          <div className="divide-y divide-border/50">
            {logs.map((log) => {
              const Icon = logIcons[log.type]
              const colors = logColors[log.type]
              return (
                <div key={log.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-md border ${colors}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
