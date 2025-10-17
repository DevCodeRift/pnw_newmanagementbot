import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import pnwkit from 'pnwkit'

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

    // Get current user's API key
    const users = await sql`
      SELECT pnw_api_key FROM users WHERE discord_id = ${session.user.id} AND api_key_verified = TRUE
    `

    if (users.length === 0 || !users[0].pnw_api_key) {
      return NextResponse.json({ error: 'No API key found. Please link your P&W account first.' }, { status: 400 })
    }

    const apiKey = users[0].pnw_api_key

    // Verify alliance exists
    const alliances = await sql`
      SELECT id FROM alliances WHERE alliance_id = ${allianceId}
    `

    if (alliances.length === 0) {
      return NextResponse.json({ error: 'Alliance not found' }, { status: 404 })
    }

    // Fetch all alliance members from P&W API using PnWKit with pagination
    pnwkit.setKey(apiKey)

    let allMembers: any[] = []
    let hasMore = true
    let page = 1

    try {
      while (hasMore) {
        console.log(`Fetching page ${page} for alliance ${allianceId}`)

        const members = await pnwkit.nationQuery(
          {
            alliance_id: [allianceId],
            first: 100,
            page: page
          },
          `
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
            alliance_seniority
            warpolicy
            dompolicy
            color
            continent
            last_active
          `
        )

        if (members.length === 0) {
          hasMore = false
        } else {
          allMembers = allMembers.concat(members)
          console.log(`Page ${page}: Found ${members.length} members (total: ${allMembers.length})`)

          // If we got less than 100, we've reached the end
          if (members.length < 100) {
            hasMore = false
          } else {
            page++
          }
        }
      }

      console.log(`Total members fetched for alliance ${allianceId}: ${allMembers.length}`)
    } catch (error) {
      console.error('PnWKit error fetching members:', error)
      throw new Error('Failed to fetch alliance members from P&W API')
    }

    const members = allMembers

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
            position, alliance_seniority, war_policy, domestic_policy, color, continent,
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
            ${member.alliance_seniority},
            ${member.warpolicy},
            ${member.dompolicy},
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
            alliance_seniority = ${member.alliance_seniority},
            war_policy = ${member.warpolicy},
            domestic_policy = ${member.dompolicy},
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
