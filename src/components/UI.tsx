'use client'

import React from 'react'
import { DISPLAY_COLS, fmtNumber, type BaseTab, type DisplayCol, type Row, toNum } from '@/lib/sheets'
import { EMPTY_FILTERS, type Filters, isMetaOk } from './useSheets'

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid var(--border-strong)',
  background: 'rgba(247, 252, 255, 0.95)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)',
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 28,
        boxShadow: 'var(--shadow-soft)',
        backdropFilter: 'blur(14px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  tone = 'var(--text)',
}: {
  label: string
  value: string | number
  sub?: string
  tone?: string
}) {
  return (
    <Card style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--muted)' }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: tone }}>{value}</div>
      {sub ? <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>{sub}</div> : null}
    </Card>
  )
}

export function Loader({ text = 'Carregando dados...' }: { text?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '3rem',
        color: 'var(--muted)',
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '2px solid var(--border-strong)',
          borderTopColor: 'var(--accent)',
          animation: 'spin .7s linear infinite',
        }}
      />
      {text}
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
      <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select style={inputBase} {...props}>
      {props.children}
    </select>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input style={inputBase} {...props} />
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      style={{
        height: 40,
        padding: '0 16px',
        borderRadius: 14,
        border: '1px solid var(--border-strong)',
        background: 'rgba(255,255,255,0.42)',
        color: 'var(--muted)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
      {...props}
    />
  )
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      style={{
        height: 40,
        padding: '0 16px',
        borderRadius: 14,
        border: '1px solid transparent',
        background: 'linear-gradient(135deg, #43b7ff, var(--accent))',
        color: '#fff',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 16px 26px rgba(29, 109, 255, 0.24)',
      }}
      {...props}
    />
  )
}

export function FilterBar({
  filters,
  setFilters,
  options,
  count,
  total,
}: {
  filters: Filters
  setFilters: (filters: Filters) => void
  options: { gv: string[]; rn: string[]; operacao: string[] }
  count: number
  total: number
}) {
  const setField =
    (key: keyof Filters) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilters({ ...filters, [key]: event.target.value })
    }

  const hasActive = Object.values(filters).some(Boolean)

  return (
    <Card style={{ padding: '18px 20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>
            Filtros
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>
            {count} de {total} PDVs visiveis
          </div>
        </div>
        {hasActive ? <GhostButton onClick={() => setFilters(EMPTY_FILTERS)}>Limpar</GhostButton> : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <Field label="Busca">
          <TextInput value={filters.busca} onChange={setField('busca')} placeholder="PDV, GV, RN..." />
        </Field>
        <Field label="GV">
          <SelectInput value={filters.gv} onChange={setField('gv')}>
            <option value="">Todos</option>
            {options.gv.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="RN">
          <SelectInput value={filters.rn} onChange={setField('rn')}>
            <option value="">Todos</option>
            {options.rn.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Operacao">
          <SelectInput value={filters.operacao} onChange={setField('operacao')}>
            <option value="">Todas</option>
            {options.operacao.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Meta">
          <SelectInput value={filters.bateuMeta} onChange={setField('bateuMeta')}>
            <option value="">Todas</option>
            <option value="ok">Somente OK</option>
            <option value="nok">Somente NOK</option>
          </SelectInput>
        </Field>
      </div>
    </Card>
  )
}

export function BaseTabs({
  value,
  onChange,
  counts,
}: {
  value: BaseTab
  onChange: (value: BaseTab) => void
  counts: Record<BaseTab, number>
}) {
  const tabs: { key: BaseTab; label: string; tone: string; dim: string }[] = [
    { key: 'litrinho', label: 'Litrinho', tone: 'var(--success)', dim: 'var(--success-soft)' },
    { key: 'inteira', label: 'Inteira', tone: 'var(--info)', dim: 'var(--info-soft)' },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const active = value === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px solid ${active ? tab.tone : 'var(--border-strong)'}`,
              background: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
              color: active ? tab.tone : 'var(--muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: active ? '0 10px 22px rgba(80, 145, 219, 0.12)' : 'none',
            }}
          >
            {tab.label}
            <span
              style={{
                minWidth: 26,
                padding: '1px 8px',
                borderRadius: 999,
                background: active ? 'var(--accent-soft)' : 'var(--panel-soft)',
                color: active ? tab.tone : 'var(--text)',
                fontSize: 11,
              }}
            >
              {counts[tab.key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SortArrow({ active, dir }: { active: boolean; dir: 'asc' | 'desc' | null }) {
  return <span style={{ fontSize: 10, color: active ? 'var(--accent)' : 'var(--muted)' }}>{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
}

function MetaBadge({ value }: { value: string }) {
  const ok = isMetaOk(value)
  const tone = ok ? 'var(--success)' : 'var(--danger)'
  const bg = ok ? 'var(--success-soft)' : 'var(--danger-soft)'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 56,
        padding: '4px 10px',
        borderRadius: 999,
        background: bg,
        color: tone,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.3,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)',
      }}
    >
      {ok ? 'OK' : 'NOK'}
    </span>
  )
}

function GapCell({ value }: { value: string }) {
  const numeric = toNum(value)
  const tone = numeric <= 0 ? 'var(--success)' : 'var(--warning)'
  return <span style={{ color: tone, fontWeight: 700 }}>{fmtNumber(value, { maximumFractionDigits: 1 })}</span>
}

function renderCell(column: DisplayCol, row: Row) {
  if (column === 'Bateu Meta') return <MetaBadge value={row[column]} />
  if (column === 'Gap Caixas') return <GapCell value={row[column]} />
  if (column === 'Meta Caixas' || column === 'Cxs. Compradas') {
    return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNumber(row[column], { maximumFractionDigits: 1 })}</span>
  }
  return row[column] || <span style={{ color: 'var(--muted)' }}>-</span>
}

type SortState = { column: DisplayCol; dir: 'asc' | 'desc' } | null

function sortValue(column: DisplayCol, row: Row) {
  if (column === 'Meta Caixas' || column === 'Cxs. Compradas' || column === 'Gap Caixas') {
    return toNum(row[column])
  }
  if (column === 'Bateu Meta') {
    return isMetaOk(row[column]) ? 1 : 0
  }
  return row[column].toLocaleLowerCase('pt-BR')
}

export function DataTable({
  rows,
  hiddenCols = [],
  emptyText = 'Nenhum resultado encontrado.',
}: {
  rows: Row[]
  hiddenCols?: DisplayCol[]
  emptyText?: string
}) {
  const [sort, setSort] = React.useState<SortState>(null)
  const columns = DISPLAY_COLS.filter((column) => !hiddenCols.includes(column))

  const sortedRows = React.useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((left, right) => {
      const a = sortValue(sort.column, left)
      const b = sortValue(sort.column, right)

      let result = 0
      if (typeof a === 'number' && typeof b === 'number') {
        result = a - b
      } else {
        result = String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' })
      }

      return sort.dir === 'asc' ? result : -result
    })
  }, [rows, sort])

  const toggleSort = (column: DisplayCol) => {
    setSort((current) => {
      if (!current || current.column !== column) return { column, dir: 'asc' }
      if (current.dir === 'asc') return { column, dir: 'desc' }
      return null
    })
  }

  if (!rows.length) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{emptyText}</div>
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.column === column
              return (
                <th
                  key={column}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.7,
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    background: '#f4faff',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    style={{
                      all: 'unset',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{column}</span>
                    <SortArrow active={active} dir={sort?.dir ?? null} />
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={`${row.GV}-${row.RN}-${row['Nome PDV']}-${index}`}>
              {columns.map((column) => (
                <td
                  key={column}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text)',
                    background: index % 2 === 0 ? 'var(--panel)' : 'var(--panel-alt)',
                  }}
                >
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>{children}</div>
    </div>
  )
}
