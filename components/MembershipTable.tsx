'use client'

import { useState, useMemo } from 'react'

type SortField = 'nation_name' | 'position' | 'alliance_seniority' | 'score' | 'cities' | 'soldiers' | 'tanks' | 'aircraft' | 'ships' | 'missiles' | 'nukes'
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
  alliance_seniority: number | null
  war_policy: string
  domestic_policy: string
  color: string
  continent: string
  last_active: string | null
}

interface MembershipTableProps {
  members: Member[]
}

// Role hierarchy for sorting (higher number = higher rank)
const ROLE_HIERARCHY: Record<string, number> = {
  'LEADER': 5,
  'HEIR': 4,
  'OFFICER': 3,
  'MEMBER': 2,
  'APPLICANT': 1,
}

const getRoleRank = (position: string): number => {
  return ROLE_HIERARCHY[position?.toUpperCase()] || 0
}

export default function MembershipTable({ members }: MembershipTableProps) {
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [positionFilter, setPositionFilter] = useState<string>('ALL')

  // Get unique positions from members
  const uniquePositions = useMemo(() => {
    const positions = new Set(members.map(m => m.position?.toUpperCase() || 'MEMBER'))
    return Array.from(positions).sort((a, b) => getRoleRank(b) - getRoleRank(a))
  }, [members])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    // First filter
    let filtered = members
    if (positionFilter !== 'ALL') {
      filtered = members.filter(m => m.position?.toUpperCase() === positionFilter)
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      // Special handling for position sorting with hierarchy
      if (sortField === 'position') {
        const aRank = getRoleRank(a.position)
        const bRank = getRoleRank(b.position)
        return sortDirection === 'asc' ? aRank - bRank : bRank - aRank
      }

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
  }, [members, sortField, sortDirection, positionFilter])

  const getPositionColor = (position: string) => {
    const pos = position?.toUpperCase() || 'MEMBER'
    switch (pos) {
      case 'LEADER': return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' }
      case 'HEIR': return { bg: '#dbeafe', text: '#1e3a8a', border: '#60a5fa' }
      case 'OFFICER': return { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' }
      case 'MEMBER': return { bg: '#d1fae5', text: '#065f46', border: '#34d399' }
      case 'APPLICANT': return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
    }
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      style={{
        background: 'none',
        border: 'none',
        color: sortField === field ? '#60a5fa' : '#d1d5db',
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
        marginBottom: '1rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#f3f4f6'
        }}>
          Alliance Members ({filteredAndSortedMembers.length}{positionFilter !== 'ALL' ? ` of ${members.length}` : ''})
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <label style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600' }}>
            Filter by Position:
          </label>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f3f4f6',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Positions</option>
            {uniquePositions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        overflowX: 'auto',
        border: '1px solid #374151',
        borderRadius: '12px',
        background: '#1f2937'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              background: '#111827',
              borderBottom: '2px solid #374151'
            }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                <SortButton field="nation_name" label="Nation" />
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>
                Leader
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <SortButton field="position" label="Position" />
                </div>
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                <SortButton field="alliance_seniority" label="Seniority" />
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
            {filteredAndSortedMembers.map((member, index) => {
              const posColor = getPositionColor(member.position)
              return (
                <tr
                  key={member.nation_id}
                  style={{
                    background: index % 2 === 0 ? '#1f2937' : '#111827',
                    borderBottom: '1px solid #374151',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#1f2937' : '#111827'}
                >
                  <td style={{ padding: '0.75rem', fontWeight: '600', color: '#f3f4f6' }}>
                    <a
                      href={`https://politicsandwar.com/nation/id=${member.nation_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'none' }}
                    >
                      {member.nation_name}
                    </a>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#9ca3af' }}>
                    {member.leader_name}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      background: posColor.bg,
                      color: posColor.text,
                      border: `1px solid ${posColor.border}`,
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {member.position || 'MEMBER'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#a78bfa', fontWeight: '600' }}>
                    {member.alliance_seniority !== null && member.alliance_seniority !== undefined ? member.alliance_seniority : 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#f3f4f6' }}>
                    {formatNumber(member.score)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.cities)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.soldiers)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.tanks)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.aircraft)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.ships)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.missiles)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#d1d5db' }}>
                    {formatNumber(member.nukes)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#9ca3af',
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '12px',
          marginTop: '1rem'
        }}>
          <p>No member data available. Click &quot;Sync Members&quot; to fetch data.</p>
        </div>
      )}

      {filteredAndSortedMembers.length === 0 && members.length > 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#9ca3af',
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '12px',
          marginTop: '1rem'
        }}>
          <p>No members found with the selected position filter.</p>
        </div>
      )}
    </div>
  )
}
