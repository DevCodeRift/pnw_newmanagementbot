'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SyncButtonProps {
  allianceId: number
}

export default function SyncButton({ allianceId }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    setMessage('')

    try {
      const response = await fetch('/api/sync-alliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allianceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync members')
      }

      setMessage(`Successfully synced ${data.syncedMembers} members!`)
      router.refresh()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="button"
        style={{
          background: syncing ? '#999' : '#10b981',
          cursor: syncing ? 'not-allowed' : 'pointer',
          opacity: syncing ? 0.7 : 1
        }}
      >
        {syncing ? 'Syncing...' : '🔄 Sync Members'}
      </button>
      {message && (
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: message.includes('Error') ? '#c03537' : '#2e7d32'
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
