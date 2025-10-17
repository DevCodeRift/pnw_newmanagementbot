'use client'

import { useState } from 'react'

type SortField = 'nation_name' | 'score' | 'cities' | 'soldiers' | 'tanks' | 'aircraft' | 'ships' | 'missiles' | 'nukes'
type SortDirection = 'asc' | 'desc'

interface Member {
  nation_id: number
  nation_name: string
  leader_name: string
  score: number
  cities: number
  soldiers: number
  tanks: number
  aircraft: number
  ships: number
  missiles: number
  nukes: number
  position: string
  war_policy: string
  domestic_policy: string
  color: string
  continent: string
  last_active: string | null
}

interface MembershipTableProps {
  members: Member[]
}

export default function MembershipTable({ members }: MembershipTableProps) {
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    const aNum = Number(aValue) || 0
    const bNum = Number(bValue) || 0

    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
  })

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      style={{
        background: 'none',
        border: 'none',
        color: sortField === field ? '#5865F2' : '#333',
        fontWeight: sortField === field ? '700' : '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.875rem',
        padding: '0.5rem',
      }}
    >
      {label}
      {sortField === field && (
        <span style={{ fontSize: '0.75rem' }}>
          {sortDirection === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </button>
  )

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '0'
    return num.toLocaleString()
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#333'
        }}>
          Alliance Members ({members.length})
        </h2>
      </div>

      <div style={{
        overflowX: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '8px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              background: '#f7f7f7',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                <SortButton field="nation_name" label="Nation" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                Leader
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>
                Position
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="score" label="Score" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="cities" label="Cities" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="soldiers" label="Soldiers" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="tanks" label="Tanks" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="aircraft" label="Aircraft" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="ships" label="Ships" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="missiles" label="Missiles" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="nukes" label="Nukes" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((member, index) => (
              <tr
                key={member.nation_id}
                style={{
                  background: index % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: '600', color: '#333' }}>
                  <a
                    href={`https://politicsandwar.com/nation/id=${member.nation_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#5865F2', textDecoration: 'none' }}
                  >
                    {member.nation_name}
                  </a>
                </td>
                <td style={{ padding: '0.75rem', color: '#666' }}>
                  {member.leader_name}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {member.position || 'MEMBER'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                  {formatNumber(member.score)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.cities)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.soldiers)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.tanks)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.aircraft)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.ships)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.missiles)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatNumber(member.nukes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#999',
          background: '#fafafa',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <p>No member data available. Click &quot;Sync Members&quot; to fetch data.</p>
        </div>
      )}
    </div>
  )
}
