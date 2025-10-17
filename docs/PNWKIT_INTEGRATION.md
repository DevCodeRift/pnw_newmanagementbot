# PnWKit Integration Documentation

This document provides comprehensive information about the PnWKit integration in this application, including setup, usage, and available API methods.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Available Helper Functions](#available-helper-functions)
5. [GraphQL API Reference](#graphql-api-reference)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

**PnWKit** is a TypeScript/JavaScript library for interacting with the Politics & War V3 GraphQL API. It provides:

- Type-safe queries for game data
- Built-in caching mechanism
- Rate limit tracking
- Pagination support
- Comprehensive TypeScript definitions

### What is Politics & War?

Politics & War is a massively multiplayer online browser-based nation simulation game. The API allows developers to query game data including:

- Nations and their statistics
- Alliances and memberships
- Wars and military actions
- Trade data and resources
- Bank records and transactions
- Bounties and baseball data

---

## Installation

PnWKit is already installed in this project. If you need to reinstall:

```bash
npm install pnwkit
```

**Current version**: `2.2.1`

---

## Configuration

### 1. Get Your API Key

1. Visit [Politics & War](https://politicsandwar.com)
2. Log into your account
3. Navigate to Account Settings
4. Find your API Key in the API section
5. Copy the key

### 2. Set Environment Variable

Add your API key to `.env`:

```env
PNW_API_KEY=your_api_key_here
```

**Important**: Never commit your API key to version control.

### 3. Client Initialization

The PnWKit client is automatically initialized in `lib/pnwkit.ts`. It will:

- Load your API key from environment variables
- Initialize on first use (lazy loading)
- Warn if the API key is missing
- Return `null` for functions if unconfigured

---

## Available Helper Functions

The application provides several helper functions in `lib/pnwkit.ts`:

### Nation Queries

#### `getNationById(nationId, fields?)`

Get a single nation by ID.

```typescript
const nation = await getNationById(100541, 'nation_name id score')
// Returns: { nation_name: "Example", id: 100541, score: 1500 }
```

#### `getNationsByIds(nationIds, fields?)`

Get multiple nations by their IDs.

```typescript
const nations = await getNationsByIds([100541, 200000], 'nation_name id')
// Returns: [{ nation_name: "Example1", id: 100541 }, ...]
```

### Alliance Queries

#### `getAllianceById(allianceId, fields?)`

Get alliance information by ID.

```typescript
const alliance = await getAllianceById(1234, 'name id score')
// Returns: { name: "Example Alliance", id: 1234, score: 50000 }
```

#### `getAllianceMembers(allianceId, fields?)`

Get all nations in an alliance.

```typescript
const members = await getAllianceMembers(1234, 'nation_name id')
// Returns: [{ nation_name: "Member1", id: 12345 }, ...]
```

### War Queries

#### `getNationWars(nationId, fields?)`

Get active wars for a nation.

```typescript
const wars = await getNationWars(100541, 'id war_type attid defid')
// Returns: [{ id: 999, war_type: "ORDINARY", attid: 100541, defid: 200000 }, ...]
```

### Trade Queries

#### `getTrades(filters?, fields?)`

Get trade data with optional filters.

```typescript
const trades = await getTrades({ offer_resource: 'FOOD' }, 'id type offer_resource')
// Returns: [{ id: 12345, type: "GLOBAL", offer_resource: "FOOD" }, ...]
```

### Bank Record Queries

#### `getBankRecords(allianceId, filters?, fields?)`

Get bank transaction records for an alliance.

```typescript
const records = await getBankRecords(1234, {}, 'id note money')
// Returns: [{ id: 56789, note: "Tax deposit", money: 1000000 }, ...]
```

### Bounty Queries

#### `getBounties(filters?, fields?)`

Get active bounties.

```typescript
const bounties = await getBounties({}, 'id amount nation { nation_name }')
// Returns: [{ id: 111, amount: 5000000, nation: { nation_name: "Target" } }, ...]
```

---

## GraphQL API Reference

### Main Query Types

PnWKit supports the following main query types:

1. **Nations** - Query nation data
2. **Alliances** - Query alliance data
3. **Cities** - Query city data
4. **Trades** - Query trade offers and history
5. **Wars** - Query war data
6. **Bank Records** - Query alliance bank transactions
7. **Bounties** - Query bounties
8. **Baseball** - Query baseball game data (Teams, Games, Players)

### Common Query Parameters

Most queries support these parameters:

- `id: [number]` - Array of IDs to query
- `first: number` - Number of results to return (pagination)
- `after: string` - Cursor for pagination
- `orderBy: string` - Field to order results by

### Available Fields

Each query type has specific fields. Here are some common ones:

#### Nation Fields
```graphql
id
nation_name
leader_name
continent
war_policy
domestic_policy
color
score
alliance_id
alliance_position
cities
soldiers
tanks
aircraft
ships
missiles
nukes
projects
wars
```

#### Alliance Fields
```graphql
id
name
acronym
score
color
date
acceptmem
flag
forumlink
irclink
treaties
```

#### War Fields
```graphql
id
date
reason
war_type
groundcontrol
airsuperiority
navalblockade
winner
attid
defid
att_alliance_id
def_alliance_id
attpoints
defpoints
```

#### Trade Fields
```graphql
id
type
date
offer_resource
offer_amount
buy_or_sell
total
accepted
accepter_id
```

### Custom Queries

You can use the raw PnWKit client for custom queries:

```typescript
import { getPnWClient } from '@/lib/pnwkit'

const client = getPnWClient()
if (client) {
  const customData = await client.nationQuery(
    { min_score: 1000, max_score: 2000, first: 10 },
    `
      id
      nation_name
      score
      cities
      alliance {
        name
      }
    `
  )
}
```

---

## Usage Examples

### Example 1: Display Nation Info on Dashboard

```typescript
// app/dashboard/page.tsx
import { getNationById } from '@/lib/pnwkit'

export default async function Dashboard() {
  // Assume user has a nation_id stored in database
  const nation = await getNationById(100541, `
    nation_name
    leader_name
    score
    cities
    soldiers
    alliance {
      name
    }
  `)

  return (
    <div>
      <h1>{nation?.nation_name}</h1>
      <p>Leader: {nation?.leader_name}</p>
      <p>Score: {nation?.score}</p>
      <p>Alliance: {nation?.alliance?.name}</p>
    </div>
  )
}
```

### Example 2: API Route for Alliance Data

```typescript
// app/api/alliance/[id]/route.ts
import { NextResponse } from 'next/server'
import { getAllianceById, getAllianceMembers } from '@/lib/pnwkit'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const allianceId = parseInt(params.id)

  const [alliance, members] = await Promise.all([
    getAllianceById(allianceId, 'id name score'),
    getAllianceMembers(allianceId, 'nation_name score')
  ])

  return NextResponse.json({
    alliance,
    members,
    memberCount: members.length
  })
}
```

### Example 3: Check Active Wars

```typescript
// lib/warChecker.ts
import { getNationWars } from '@/lib/pnwkit'

export async function checkNationUnderAttack(nationId: number) {
  const wars = await getNationWars(nationId, `
    id
    war_type
    attid
    defid
    attacker {
      nation_name
    }
    defender {
      nation_name
    }
  `)

  const defensive = wars.filter(war => war.defid === nationId)
  const offensive = wars.filter(war => war.attid === nationId)

  return {
    isUnderAttack: defensive.length > 0,
    defensiveWars: defensive,
    offensiveWars: offensive,
    totalWars: wars.length
  }
}
```

### Example 4: Trade Monitor

```typescript
// app/api/trades/route.ts
import { NextResponse } from 'next/server'
import { getTrades } from '@/lib/pnwkit'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource') || 'FOOD'

  const trades = await getTrades(
    {
      offer_resource: resource,
      buy_or_sell: 'SELL'
    },
    'id offer_amount price accepted'
  )

  const cheapest = trades.sort((a, b) => a.price - b.price).slice(0, 10)

  return NextResponse.json({ cheapest })
}
```

---

## Best Practices

### 1. Rate Limiting

The Politics & War API has rate limits. PnWKit includes built-in tracking, but you should:

- Cache results when possible
- Avoid making the same query multiple times
- Use pagination for large datasets
- Implement retry logic with exponential backoff

### 2. Error Handling

Always wrap PnWKit calls in try-catch:

```typescript
try {
  const nation = await getNationById(id)
  if (!nation) {
    // Handle not found
  }
} catch (error) {
  console.error('PnWKit error:', error)
  // Handle error appropriately
}
```

### 3. Field Selection

Only request fields you need to reduce API load and response size:

```typescript
// Good: Only request needed fields
await getNationById(id, 'nation_name score')

// Bad: Requesting everything
await getNationById(id, '* alliance { * } cities { * }')
```

### 4. Caching Strategy

Consider implementing caching for data that doesn't change frequently:

```typescript
// Example with Next.js cache
export const revalidate = 300 // Revalidate every 5 minutes

export async function getAllianceData(id: number) {
  return await getAllianceById(id, 'name score')
}
```

### 5. Pagination

For large datasets, use pagination:

```typescript
const client = getPnWClient()
let allNations = []
let after = null

do {
  const result = await client.nationQuery(
    { first: 100, after },
    'id nation_name'
  )
  allNations = [...allNations, ...result.data]
  after = result.paginatorInfo.hasNextPage ? result.paginatorInfo.endCursor : null
} while (after)
```

---

## Troubleshooting

### API Key Issues

**Problem**: Functions return `null` or errors about missing API key

**Solution**:
1. Verify `PNW_API_KEY` is in your `.env` file
2. Restart your development server
3. Check the API key is valid at politicsandwar.com

### Rate Limit Errors

**Problem**: Getting 429 errors or rate limit warnings

**Solution**:
1. Reduce query frequency
2. Implement caching
3. Use pagination instead of large queries
4. Wait before retrying

### TypeScript Errors

**Problem**: Type errors with PnWKit queries

**Solution**:
1. Update to latest PnWKit version
2. Use type assertions if needed: `as any`
3. Check the GraphQL schema documentation

### No Data Returned

**Problem**: Queries return empty arrays or null

**Solution**:
1. Verify the ID exists in the game
2. Check your query filters aren't too restrictive
3. Ensure the field names are correct
4. Test the query in the Politics & War API explorer

### Connection Issues

**Problem**: Timeouts or connection errors

**Solution**:
1. Check your internet connection
2. Verify Politics & War servers are up
3. Implement retry logic with backoff
4. Check for any maintenance announcements

---

## Additional Resources

- **PnWKit Documentation**: https://bsnk-dev.github.io/pnwkit/
- **PnWKit GitHub**: https://github.com/bsnk-dev/pnwkit
- **Politics & War**: https://politicsandwar.com
- **P&W API Documentation**: https://politicsandwar.com/api/
- **P&W Discord**: Join the community for API support

---

## Support

For issues specific to:

- **PnWKit Library**: Report on [GitHub Issues](https://github.com/bsnk-dev/pnwkit/issues)
- **Politics & War API**: Contact P&W support or ask in their Discord
- **This Integration**: Check the main README or create an issue in this repository

---

**Last Updated**: 2025-10-17
**PnWKit Version**: 2.2.1
**API Version**: Politics & War V3
