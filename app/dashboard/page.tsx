import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import Image from 'next/image'
import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getAuth()

  if (!session) {
    redirect('/login')
  }

  // Get user data including PnW info
  let userData: any = null
  if (process.env.DATABASE_URL) {
    try {
      const users = await sql`
        SELECT * FROM users WHERE discord_id = ${session.user.id}
      `
      userData = users[0] || null
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  // Check if user needs to link API key
  if (userData && !userData.api_key_verified) {
    redirect('/setup')
  }

  const allianceSlug = userData?.alliance_name
    ? userData.alliance_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null

  return (
    <div className="container">
      <div className="card">
        <div className="user-info">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={64}
              height={64}
              className="avatar"
            />
          )}
          <div className="user-details">
            <h2>{session.user?.name || 'Unknown User'}</h2>
            <p>{session.user?.email || 'No email'}</p>
          </div>
        </div>

        <div className="stats">
          <p><strong>Discord ID:</strong> {session.user?.id}</p>
          <p><strong>Status:</strong> Authenticated</p>
          {userData?.api_key_verified && (
            <>
              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
              <p><strong>Nation:</strong> {userData.nation_name || 'Unknown'}</p>
              <p><strong>Leader:</strong> {userData.leader_name || 'Unknown'}</p>
              {userData.alliance_name && (
                <>
                  <p><strong>Alliance:</strong> {userData.alliance_name}</p>
                  <p><strong>Position:</strong> {userData.alliance_position || 'Member'}</p>
                </>
              )}
              {userData.last_sync && (
                <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
                  Last synced: {new Date(userData.last_sync).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>

        {userData?.api_key_verified && allianceSlug && (
          <div style={{ marginBottom: '1rem' }}>
            <Link
              href={`/${allianceSlug}`}
              className="button"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                marginBottom: '0.5rem'
              }}
            >
              View Alliance Page
            </Link>
          </div>
        )}

        {!userData?.api_key_verified && (
          <div style={{
            background: '#fff3e0',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #ffcc80'
          }}>
            <p style={{ color: '#e65100', marginBottom: '0.5rem', fontWeight: '600' }}>
              P&W Account Not Linked
            </p>
            <p style={{ color: '#f57c00', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Link your Politics & War account to access alliance features.
            </p>
            <Link
              href="/setup"
              className="button"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                fontSize: '0.875rem',
                padding: '0.75rem 1.5rem'
              }}
            >
              Link P&W Account
            </Link>
          </div>
        )}

        <SignOutButton />
      </div>
    </div>
  )
}
