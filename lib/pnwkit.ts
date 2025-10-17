import pnwkit from 'pnwkit'

// Initialize PnWKit with API key from environment
let pnwClient: typeof pnwkit | null = null

export function getPnWClient() {
  if (!pnwClient) {
    if (!process.env.PNW_API_KEY) {
      console.warn('PNW_API_KEY not set. PnWKit functionality will be limited.')
      return null
    }

    pnwkit.setKey(process.env.PNW_API_KEY)
    pnwClient = pnwkit
  }

  return pnwClient
}

// Helper functions for common queries

/**
 * Get nation data by nation ID
 */
export async function getNationById(nationId: number, fields: string = 'nation_name id') {
  const client = getPnWClient()
  if (!client) return null

  try {
    const nations = await client.nationQuery({ id: [nationId], first: 1 }, fields)
    return nations[0] || null
  } catch (error) {
    console.error('Error fetching nation:', error)
    return null
  }
}

/**
 * Get multiple nations by IDs
 */
export async function getNationsByIds(nationIds: number[], fields: string = 'nation_name id') {
  const client = getPnWClient()
  if (!client) return []

  try {
    return await client.nationQuery({ id: nationIds, first: nationIds.length }, fields)
  } catch (error) {
    console.error('Error fetching nations:', error)
    return []
  }
}

/**
 * Get alliance data by alliance ID
 */
export async function getAllianceById(allianceId: number, fields: string = 'name id') {
  const client = getPnWClient()
  if (!client) return null

  try {
    const alliances = await client.allianceQuery({ id: [allianceId], first: 1 }, fields)
    return alliances[0] || null
  } catch (error) {
    console.error('Error fetching alliance:', error)
    return null
  }
}

/**
 * Get nations in an alliance
 */
export async function getAllianceMembers(allianceId: number, fields: string = 'nation_name id') {
  const client = getPnWClient()
  if (!client) return []

  try {
    return await client.nationQuery({ alliance_id: [allianceId], first: 100 }, fields)
  } catch (error) {
    console.error('Error fetching alliance members:', error)
    return []
  }
}

/**
 * Get active wars for a nation
 */
export async function getNationWars(nationId: number, fields: string = 'id war_type') {
  const client = getPnWClient()
  if (!client) return []

  try {
    return await client.warQuery({
      nation_id: [nationId],
      active: true,
      first: 50
    }, fields)
  } catch (error) {
    console.error('Error fetching nation wars:', error)
    return []
  }
}

/**
 * Get trade data
 */
export async function getTrades(filters: any = {}, fields: string = 'id type') {
  const client = getPnWClient()
  if (!client) return []

  try {
    return await client.tradeQuery({ first: 50, ...filters }, fields)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return []
  }
}

/**
 * Get bank records for an alliance
 */
export async function getBankRecords(
  allianceId: number,
  filters: any = {},
  fields: string = 'id note'
) {
  const client = getPnWClient()
  if (!client) return []

  try {
    return await client.bankRecQuery({
      or_id: [allianceId],
      first: 50,
      ...filters
    }, fields)
  } catch (error) {
    console.error('Error fetching bank records:', error)
    return []
  }
}

/**
 * Get bounties
 */
export async function getBounties(filters: any = {}, fields: string = 'id amount') {
  const client = getPnWClient()
  if (!client) return []

  try {
    return await client.bountyQuery({ first: 50, ...filters }, fields)
  } catch (error) {
    console.error('Error fetching bounties:', error)
    return []
  }
}

export default getPnWClient
