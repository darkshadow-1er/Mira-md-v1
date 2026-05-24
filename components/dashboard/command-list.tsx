'use client'

import { Terminal, Search, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface Command {
  name: string
  description: string
  usage: string
  category: string
}

interface CommandListProps {
  commands: Command[]
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  utility: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  admin: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  fun: { bg: 'bg-chart-4/10', text: 'text-chart-4', border: 'border-chart-4/30' },
  ai: { bg: 'bg-neon-green/10', text: 'text-neon-green', border: 'border-neon-green/30' },
  info: { bg: 'bg-chart-3/10', text: 'text-chart-3', border: 'border-chart-3/30' },
}

export function CommandList({ commands }: CommandListProps) {
  const [search, setSearch] = useState('')
  
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Available Commands</h3>
              <p className="text-xs text-muted-foreground">{commands.length} commands loaded</p>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input/50 border-border"
          />
        </div>
      </div>

      {/* Command List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredCommands.length > 0 ? (
          <div className="divide-y divide-border/50">
            {filteredCommands.map((cmd) => {
              const colors = categoryColors[cmd.category] || categoryColors.utility
              return (
                <div
                  key={cmd.name}
                  className="p-4 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-semibold text-primary">
                          {cmd.usage}
                        </code>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cmd.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Terminal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No commands found</p>
          </div>
        )}
      </div>
    </div>
  )
}
