import { redirect, notFound } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import Image from 'next/image'
import SignOutButton from '@/components/SignOutButton'
import MembershipTable from '@/components/MembershipTable'
import SyncButton from '@/components/SyncButton'

interface AlliancePageProps {
  params: {
    alliance: string
  }
}

export default async function AlliancePage({ params }: AlliancePageProps) {
  const session = await getAuth()

  if (!session) {
    redirect('/login')
  }

  // Get alliance data from database
  let alliance
  try {
    const alliances = await sql`
      SELECT * FROM alliances WHERE slug = ${params.alliance}
    `

    if (alliances.length === 0) {
      notFound()
    }

    alliance = alliances[0]
  } catch (error) {
    console.error('Error fetching alliance:', error)
    notFound()
  }

  // Get alliance members with full stats
  let members: any[] = []
  try {
    members = await sql`
      SELECT
        am.nation_id,
        am.nation_name,
        am.leader_name,
        am.score,
        am.cities,
        am.soldiers,
        am.tanks,
        am.aircraft,
        am.ships,
        am.missiles,
        am.nukes,
        am.position,
        am.war_policy,
        am.domestic_policy,
        am.color,
        am.continent,
        am.last_active,
        am.updated_at
      FROM alliance_members am
      WHERE am.alliance_id = ${alliance.id}
      ORDER BY am.score DESC NULLS LAST
    `
  } catch (error) {
    console.error('Error fetching members:', error)
  }

  // Check if current user is a member
  let currentUserData
  try {
    const userData = await sql`
      SELECT alliance_id, nation_name, alliance_position
      FROM users
      WHERE discord_id = ${session.user.id}
    `
    currentUserData = userData[0]
  } catch (error) {
    console.error('Error fetching user data:', error)
  }

  const isAllianceMember = currentUserData?.alliance_id === alliance.alliance_id

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '900px' }}>
        {/* Alliance Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div>
            <h1 className="title" style={{ marginBottom: '0.5rem', textAlign: 'left' }}>
              {alliance.alliance_name}
            </h1>
            {alliance.acronym && (
              <p style={{ color: '#666', fontSize: '1rem' }}>[{alliance.acronym}]</p>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {alliance.color && (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: alliance.color.toLowerCase(),
                border: '2px solid #ddd'
              }} title={alliance.color} />
            )}
          </div>
        </div>

        {/* Alliance Stats */}
        <div className="stats" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Alliance ID</p>
              <p style={{ color: '#333', fontSize: '1.125rem', fontWeight: '600' }}>{alliance.alliance_id}</p>
            </div>
            <div>
              <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Score</p>
              <p style={{ color: '#333', fontSize: '1.125rem', fontWeight: '600' }}>
                {alliance.score?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Members</p>
              <p style={{ color: '#333', fontSize: '1.125rem', fontWeight: '600' }}>{members.length}</p>
            </div>
          </div>
        </div>

        {/* Current User Status */}
        {isAllianceMember && currentUserData && (
          <div style={{
            background: '#e8f5e9',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #a5d6a7'
          }}>
            <p style={{ color: '#2e7d32', fontSize: '0.875rem', fontWeight: '600' }}>
              You are a member of this alliance
            </p>
            <p style={{ color: '#558b2f', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Nation: {currentUserData.nation_name} • Position: {currentUserData.alliance_position}
            </p>
          </div>
        )}

        {!isAllianceMember && (
          <div style={{
            background: '#fff3e0',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #ffcc80'
          }}>
            <p style={{ color: '#e65100', fontSize: '0.875rem' }}>
              You are not a member of this alliance
            </p>
          </div>
        )}

        {/* Membership Table */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <SyncButton allianceId={alliance.alliance_id} />
          </div>
          <MembershipTable members={members} />
        </div>

        {/* Actions */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <SignOutButton />
          <a
            href="/dashboard"
            className="button"
            style={{
              background: '#6c757d',
              textDecoration: 'none'
            }}
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
