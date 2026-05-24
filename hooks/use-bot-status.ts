'use client'

import { useState, useEffect, useCallback } from 'react'

export interface BotStatus {
  status: 'connected' | 'disconnected' | 'connecting'
  stats: {
    messagesProcessed: number
    activeUsers: number
    commandsExecuted: number
    uptime: string
  }
  bot?: {
    name: string
    version: string
    prefix: string
    commandsLoaded: number
  }
  server?: {
    nodeVersion: string
    platform: string
    memory: {
      used: number
      total: number
    }
  }
}

const defaultStatus: BotStatus = {
  status: 'disconnected',
  stats: {
    messagesProcessed: 0,
    activeUsers: 0,
    commandsExecuted: 0,
    uptime: '0m 0s',
  },
}

export function useBotStatus(pollInterval = 5000) {
  const [botStatus, setBotStatus] = useState<BotStatus>(defaultStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      
      const data = await response.json()
      
      setBotStatus({
        status: data.status || 'disconnected',
        stats: data.stats || defaultStatus.stats,
        bot: data.bot,
        server: data.server,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setBotStatus((prev) => ({ ...prev, status: 'disconnected' }))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchStatus()

    // Setup polling
    const interval = setInterval(fetchStatus, pollInterval)

    return () => clearInterval(interval)
  }, [fetchStatus, pollInterval])

  const refetch = () => {
    setIsLoading(true)
    fetchStatus()
  }

  return {
    ...botStatus,
    isLoading,
    error,
    refetch,
  }
}
