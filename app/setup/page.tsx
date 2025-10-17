import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import ApiKeyForm from '@/components/ApiKeyForm'
import { sql } from '@/lib/db'

export default async function SetupPage() {
  const session = await getAuth()

  if (!session) {
    redirect('/login')
  }

  // Check if user already has API key verified
  if (process.env.DATABASE_URL) {
    try {
      const users = await sql`
        SELECT api_key_verified, alliance_name
        FROM users
        WHERE discord_id = ${session.user.id}
      `

      if (users.length > 0 && users[0].api_key_verified) {
        // User already set up, redirect to their alliance page or dashboard
        if (users[0].alliance_name) {
          const slug = users[0].alliance_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          redirect(`/${slug}`)
        } else {
          redirect('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking API key status:', error)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px' }}>
        <h1 className="title">Link Your Politics & War Account</h1>
        <p className="subtitle">
          To access alliance management features, please link your P&W account by providing your API key.
        </p>

        <div style={{
          background: '#f0f4ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #d0d9ff'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
            How to get your API key:
          </h3>
          <ol style={{ marginLeft: '1.25rem', color: '#666', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <li>Go to <a href="https://politicsandwar.com/account/" target="_blank" rel="noopener noreferrer" style={{ color: '#5865F2', textDecoration: 'underline' }}>politicsandwar.com/account</a></li>
            <li>Scroll down to the "API Key" section</li>
            <li>Copy your API key</li>
            <li>Paste it below and click "Link Account"</li>
          </ol>
        </div>

        <ApiKeyForm />

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: '#999',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Your API key is encrypted and stored securely. We only use it to fetch your nation and alliance information.
        </p>
      </div>
    </div>
  )
}
