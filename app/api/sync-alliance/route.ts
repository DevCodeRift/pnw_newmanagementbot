import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allianceId } = await request.json()

    if (!allianceId || typeof allianceId !== 'number') {
      return NextResponse.json({ error: 'Alliance ID is required' }, { status: 400 })
    }

    // Get alliance data to find an API key
    const alliances = await sql`
      SELECT a.*, u.pnw_api_key
      FROM alliances a
      LEFT JOIN users u ON u.alliance_id = a.alliance_id AND u.api_key_verified = TRUE
      WHERE a.alliance_id = ${allianceId}
      LIMIT 1
    `

    if (alliances.length === 0) {
      return NextResponse.json({ error: 'Alliance not found' }, { status: 404 })
    }

    const alliance = alliances[0]
    const apiKey = alliance.pnw_api_key

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key available for this alliance' }, { status: 400 })
    }

    // Fetch all alliance members from P&W API
    const graphqlQuery = {
      query: `{
        nations(first: 100, alliance_id: [${allianceId}]) {
          data {
            id
            nation_name
            leader_name
            score
            num_cities
            soldiers
            tanks
            aircraft
            ships
            missiles
            nukes
            alliance_position
            war_policy
            domestic_policy
            color
            continent
            last_active
          }
        }
      }`
    }

    const response = await fetch('https://api.politicsandwar.com/graphql?api_key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch alliance members')
    }

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }

    const members = result.data?.nations?.data || []

    // Get alliance database ID
    const allianceRecord = await sql`
      SELECT id FROM alliances WHERE alliance_id = ${allianceId}
    `

    if (allianceRecord.length === 0) {
      return NextResponse.json({ error: 'Alliance not found in database' }, { status: 404 })
    }

    const allianceDbId = allianceRecord[0].id

    // Sync each member to database
    let syncedCount = 0
    for (const member of members) {
      try {
        // Check if user exists in users table
        const userRecord = await sql`
          SELECT id FROM users WHERE nation_id = ${member.id}
        `

        let userId = null
        if (userRecord.length > 0) {
          userId = userRecord[0].id
        }

        // Upsert member data
        await sql`
          INSERT INTO alliance_members (
            alliance_id, nation_id, user_id, nation_name, leader_name,
            score, cities, soldiers, tanks, aircraft, ships, missiles, nukes,
            position, war_policy, domestic_policy, color, continent,
            last_active, updated_at
          )
          VALUES (
            ${allianceDbId},
            ${member.id},
            ${userId},
            ${member.nation_name},
            ${member.leader_name},
            ${member.score},
            ${member.num_cities},
            ${member.soldiers},
            ${member.tanks},
            ${member.aircraft},
            ${member.ships},
            ${member.missiles},
            ${member.nukes},
            ${member.alliance_position},
            ${member.war_policy},
            ${member.domestic_policy},
            ${member.color},
            ${member.continent},
            ${member.last_active ? new Date(member.last_active) : null},
            NOW()
          )
          ON CONFLICT (nation_id, alliance_id)
          DO UPDATE SET
            nation_name = ${member.nation_name},
            leader_name = ${member.leader_name},
            score = ${member.score},
            cities = ${member.num_cities},
            soldiers = ${member.soldiers},
            tanks = ${member.tanks},
            aircraft = ${member.aircraft},
            ships = ${member.ships},
            missiles = ${member.missiles},
            nukes = ${member.nukes},
            position = ${member.alliance_position},
            war_policy = ${member.war_policy},
            domestic_policy = ${member.domestic_policy},
            color = ${member.color},
            continent = ${member.continent},
            last_active = ${member.last_active ? new Date(member.last_active) : null},
            updated_at = NOW()
        `

        syncedCount++
      } catch (error) {
        console.error(`Error syncing member ${member.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      syncedMembers: syncedCount,
      totalMembers: members.length,
    })
  } catch (error) {
    console.error('Error in sync-alliance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
