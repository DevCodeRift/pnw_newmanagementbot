import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { sql } from '@/lib/db'
import pnwkit from 'pnwkit'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Verify the API key by fetching user's nation data
    pnwkit.setKey(apiKey)

    let nationData
    try {
      // Get authenticated user's nation using the "me" query via vmode parameter
      // When using an authenticated API key, we query for the nation that owns the key
      const nations = await pnwkit.nationQuery(
        { vmode: true, first: 1 },
        `
          id
          nation_name
          leader_name
          alliance_id
          alliance_position
          alliance {
            id
            name
            acronym
            color
            score
          }
        `
      )

      if (!nations || nations.length === 0) {
        return NextResponse.json(
          { error: 'Invalid API key or no nation found' },
          { status: 400 }
        )
      }

      nationData = nations[0]
    } catch (error: any) {
      console.error('PnWKit error:', error)
      // Check if error is due to invalid API key
      if (error.message && error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check that it is correct and try again.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to verify API key. Please try again.' },
        { status: 400 }
      )
    }

    // Create slug from alliance name
    const allianceSlug = nationData.alliance?.name
      ? nationData.alliance.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : null

    // Store alliance data if user is in an alliance
    let allianceDbId = null
    if (nationData.alliance && allianceSlug) {
      try {
        // Check if alliance exists
        const existingAlliance = await sql`
          SELECT id FROM alliances WHERE alliance_id = ${nationData.alliance.id}
        `

        if (existingAlliance.length > 0) {
          // Update existing alliance
          await sql`
            UPDATE alliances
            SET
              alliance_name = ${nationData.alliance.name},
              acronym = ${nationData.alliance.acronym},
              slug = ${allianceSlug},
              color = ${nationData.alliance.color},
              score = ${nationData.alliance.score},
              updated_at = NOW()
            WHERE alliance_id = ${nationData.alliance.id}
          `
          allianceDbId = existingAlliance[0].id
        } else {
          // Create new alliance
          const newAlliance = await sql`
            INSERT INTO alliances (alliance_id, alliance_name, acronym, slug, color, score)
            VALUES (
              ${nationData.alliance.id},
              ${nationData.alliance.name},
              ${nationData.alliance.acronym},
              ${allianceSlug},
              ${nationData.alliance.color},
              ${nationData.alliance.score}
            )
            RETURNING id
          `
          allianceDbId = newAlliance[0].id
        }
      } catch (error) {
        console.error('Error creating/updating alliance:', error)
      }
    }

    // Update user with API key and nation data
    await sql`
      UPDATE users
      SET
        pnw_api_key = ${apiKey},
        nation_id = ${nationData.id},
        nation_name = ${nationData.nation_name},
        leader_name = ${nationData.leader_name},
        alliance_id = ${nationData.alliance?.id || null},
        alliance_name = ${nationData.alliance?.name || null},
        alliance_position = ${nationData.alliance_position || null},
        api_key_verified = TRUE,
        last_sync = NOW()
      WHERE discord_id = ${session.user.id}
    `

    // Get user's database ID for alliance_members table
    if (allianceDbId) {
      const user = await sql`
        SELECT id FROM users WHERE discord_id = ${session.user.id}
      `

      if (user.length > 0) {
        // Create or update alliance membership
        await sql`
          INSERT INTO alliance_members (user_id, alliance_id, nation_id, position)
          VALUES (${user[0].id}, ${allianceDbId}, ${nationData.id}, ${nationData.alliance_position || 'MEMBER'})
          ON CONFLICT (user_id, alliance_id)
          DO UPDATE SET
            nation_id = ${nationData.id},
            position = ${nationData.alliance_position || 'MEMBER'}
        `
      }
    }

    return NextResponse.json({
      success: true,
      nationName: nationData.nation_name,
      allianceName: nationData.alliance?.name || null,
      allianceSlug: allianceSlug,
    })
  } catch (error) {
    console.error('Error in link-api-key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
