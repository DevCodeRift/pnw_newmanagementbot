'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/link-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link API key')
      }

      // Success! Redirect to alliance page
      if (data.allianceSlug) {
        router.push(`/${data.allianceSlug}`)
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="apiKey"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#333'
          }}
        >
          Politics & War API Key
        </label>
        <input
          type="text"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your P&W API key"
          required
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#5865F2'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          color: '#c33',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !apiKey}
        className="button"
        style={{
          opacity: (loading || !apiKey) ? 0.6 : 1,
          cursor: (loading || !apiKey) ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Linking Account...' : 'Link Account'}
      </button>
    </form>
  )
}
