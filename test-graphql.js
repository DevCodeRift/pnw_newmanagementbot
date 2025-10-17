// Test GraphQL query with custom position info
const API_KEY = 'd6fbb8db5f7505ed39d1'
const GRAPHQL_ENDPOINT = 'https://api.politicsandwar.com/graphql'

async function testQuery() {
  // First, get user's nation to find their alliance
  const meQuery = `
    query {
      me {
        nation {
          id
          nation_name
          alliance_id
          alliance {
            id
            name
          }
        }
      }
    }
  `

  const endpoint = `${GRAPHQL_ENDPOINT}?api_key=${API_KEY}`

  try {
    console.log('🔍 Getting your nation and alliance info...\n')

    const meResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: meQuery }),
    })

    const meResult = await meResponse.json()

    if (meResult.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(meResult.errors, null, 2))
      return
    }

    const nation = meResult.data.me.nation
    console.log(`✅ Your Nation: ${nation.nation_name} (ID: ${nation.id})`)
    console.log(`✅ Your Alliance: ${nation.alliance.name} (ID: ${nation.alliance_id})\n`)

    // Now query members with position info
    console.log('🔍 Querying first 5 alliance members with position info...\n')

    const query = `
      query($allianceId: [Int], $page: Int) {
        nations(
          alliance_id: $allianceId
          first: 5
          page: $page
        ) {
          data {
            id
            nation_name
            alliance_position
            alliance_position_id
            alliance_position_info {
              id
              name
              position_level
              leader
              heir
            }
            alliance_seniority
          }
          paginatorInfo {
            count
            currentPage
            hasMorePages
          }
        }
      }
    `

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { allianceId: [parseInt(nation.alliance_id)], page: 1 },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error('❌ GraphQL Errors:')
      console.error(JSON.stringify(result.errors, null, 2))
      return
    }

    if (!result.data) {
      console.error('❌ No data returned')
      return
    }

    console.log('✅ Query successful!')
    console.log('\nPagination Info:')
    console.log(JSON.stringify(result.data.nations.paginatorInfo, null, 2))

    console.log('\nFirst 3 members with position info:')
    result.data.nations.data.slice(0, 3).forEach(member => {
      console.log('\n---')
      console.log(`Nation: ${member.nation_name}`)
      console.log(`Alliance Position Enum: ${member.alliance_position}`)
      console.log(`Alliance Position ID: ${member.alliance_position_id}`)
      console.log(`Alliance Seniority: ${member.alliance_seniority} days`)
      if (member.alliance_position_info) {
        console.log(`✨ Custom Position Name: "${member.alliance_position_info.name}"`)
        console.log(`Position Level: ${member.alliance_position_info.position_level}`)
        console.log(`Is Leader: ${member.alliance_position_info.leader}`)
        console.log(`Is Heir: ${member.alliance_position_info.heir}`)
      } else {
        console.log('⚠️ No alliance_position_info returned')
      }
    })

  } catch (error) {
    console.error('❌ Request failed:', error)
  }
}

testQuery()
