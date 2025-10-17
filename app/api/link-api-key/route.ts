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

    // Verify the API key by fetching user's nation data using raw GraphQL query
    // The P&W API has a "me" query that returns the authenticated user's nation
    let nationData
    try {
      const graphqlQuery = {
        query: `{
          me {
            nation {
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
        throw new Error('Failed to fetch nation data')
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }

      if (!result.data?.me?.nation) {
        return NextResponse.json(
          { error: 'Invalid API key or no nation found' },
          { status: 400 }
        )
      }

      nationData = result.data.me.nation
    } catch (error: any) {
      console.error('PnW API error:', error)
      // Check if error is due to invalid API key
      if (error.message && (error.message.includes('Unauthorized') || error.message.includes('invalid'))) {
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
