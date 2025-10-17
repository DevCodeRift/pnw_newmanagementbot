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
          background: syncing ? '#4b5563' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: syncing ? '1px solid #6b7280' : '1px solid #34d399',
          cursor: syncing ? 'not-allowed' : 'pointer',
          opacity: syncing ? 0.7 : 1,
          boxShadow: syncing ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)'
        }}
      >
        {syncing ? 'Syncing...' : '🔄 Sync Members'}
      </button>
      {message && (
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: message.includes('Error') ? '#f87171' : '#6ee7b7',
          fontWeight: '600'
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
