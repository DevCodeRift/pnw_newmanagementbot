/**
 * Direct GraphQL client for Politics & War API
 * Used instead of pnwkit to access newer schema fields
 */

const GRAPHQL_ENDPOINT = 'https://api.politicsandwar.com/graphql'

interface GraphQLResponse<T = any> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

export async function graphqlQuery<T = any>(
  query: string,
  variables: Record<string, any> = {},
  apiKey: string
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
  }

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data
}

/**
 * Query nations with full position info including custom position names
 */
export async function queryNationsWithPositions(
  allianceId: number,
  page: number,
  apiKey: string
) {
  const query = `
    query($allianceId: [Int], $page: Int) {
      nations(
        alliance_id: $allianceId
        first: 100
        page: $page
      ) {
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
          alliance_position_id
          alliance_position_info {
            id
            name
            position_level
            leader
            heir
          }
          alliance_seniority
          warpolicy
          dompolicy
          color
          continent
          last_active
        }
        paginatorInfo {
          count
          currentPage
          hasMorePages
        }
      }
    }
  `

  const result = await graphqlQuery<{
    nations: {
      data: any[]
      paginatorInfo: {
        count: number
        currentPage: number
        hasMorePages: boolean
      }
    }
  }>(query, { allianceId: [allianceId], page }, apiKey)

  return result.nations
}

/**
 * Query alliance positions (government structure)
 */
export async function queryAlliancePositions(allianceId: number, apiKey: string) {
  const query = `
    query($allianceId: [Int]) {
      alliances(id: $allianceId, first: 1) {
        data {
          id
          name
          alliance_positions {
            id
            name
            position_level
            leader
            heir
            date
            date_modified
          }
        }
      }
    }
  `

  const result = await graphqlQuery<{
    alliances: {
      data: Array<{
        id: string
        name: string
        alliance_positions: Array<{
          id: string
          name: string
          position_level: number
          leader: boolean
          heir: boolean
          date: string
          date_modified: string
        }>
      }>
    }
  }>(query, { allianceId: [allianceId] }, apiKey)

  return result.alliances.data[0]
}
