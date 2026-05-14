'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Row } from '@/lib/sheets'
import { fmtNumber, toNum } from '@/lib/sheets'
import { buildOptions, EMPTY_FILTERS, filterRows, isMetaOk, type BaseScope, type Filters, useSheets } from '@/components/useSheets'
import { Card, Field, FilterBar, Loader, PrimaryButton, SectionTitle, SelectInput, StatCard } from '@/components/UI'

function getScopeRows(scope: BaseScope, litrinhoRows: Row[], inteiraRows: Row[]) {
  if (scope === 'litrinho') return litrinhoRows
  if (scope === 'inteira') return inteiraRows
  return [...litrinhoRows, ...inteiraRows]
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function countBy(rows: Row[], key: keyof Row, limit = 8) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const value = row[key] || '(vazio)'
    map.set(value, (map.get(value) ?? 0) + 1)
  })

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }))
}

function topGapRows(rows: Row[], limit = 8) {
  return [...rows]
    .sort((a, b) => toNum(b['Gap Caixas']) - toNum(a['Gap Caixas']))
    .slice(0, limit)
}

function Donut({ ok, nok }: { ok: number; nok: number }) {
  const total = ok + nok
  const pct = percent(ok, total)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const okLength = total ? (ok / total) * circumference : 0
  const nokLength = total ? (nok / total) * circumference : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={radius} fill="none" stroke="var(--panel-soft)" strokeWidth="12" />
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke="var(--success)"
          strokeWidth="12"
          strokeDasharray={`${okLength} ${circumference - okLength}`}
          strokeDashoffset={circumference * 0.25}
        />
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke="var(--danger)"
          strokeWidth="12"
          strokeDasharray={`${nokLength} ${circumference - nokLength}`}
          strokeDashoffset={circumference * 0.25 - okLength}
        />
        <text x="54" y="50" textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: 'var(--text)' }}>
          {pct}%
        </text>
        <text x="54" y="66" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--muted)' }}>
          metas OK
        </text>
      </svg>

      <div style={{ display: 'grid', gap: 8, minWidth: 140 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: 'var(--muted)' }}>OK</span>
          <strong style={{ color: 'var(--success)' }}>{ok}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: 'var(--muted)' }}>NOK</span>
          <strong style={{ color: 'var(--danger)' }}>{nok}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: 'var(--muted)' }}>Total</span>
          <strong>{total}</strong>
        </div>
      </div>
    </div>
  )
}

function BarList({
  title,
  data,
  color,
}: {
  title: string
  data: { label: string; value: number }[]
  color: string
}) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <Card style={{ padding: '18px 20px' }}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'grid', gap: 10 }}>
        {data.length ? (
          data.map((item) => (
            <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 10, alignItems: 'center' }}>
              <span title={item.label} style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <div style={{ height: 12, borderRadius: 999, background: 'var(--panel-soft)', overflow: 'hidden' }}>
                <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', borderRadius: 999, background: color }} />
              </div>
              <strong style={{ fontSize: 12 }}>{item.value}</strong>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sem dados para exibir.</div>
        )}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { litrinhoData, inteiraData, loading, error, lastModified, load, reload } = useSheets()
  const [scope, setScope] = useState<BaseScope>('ambas')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  useEffect(() => {
    load()
  }, [load])

  const litrinhoRows = litrinhoData?.rows ?? []
  const inteiraRows = inteiraData?.rows ?? []
  const optionRows = useMemo(() => getScopeRows(scope, litrinhoRows, inteiraRows), [scope, litrinhoRows, inteiraRows])
  const options = useMemo(() => buildOptions(optionRows), [optionRows])
  const filteredRows = useMemo(() => filterRows(optionRows, filters), [optionRows, filters])

  const totalPdvs = filteredRows.length
  const metasOk = filteredRows.filter((row) => isMetaOk(row['Bateu Meta'])).length
  const metasNok = totalPdvs - metasOk
  const totalMeta = filteredRows.reduce((sum, row) => sum + toNum(row['Meta Caixas']), 0)
  const totalCompradas = filteredRows.reduce((sum, row) => sum + toNum(row['Cxs. Compradas']), 0)
  const totalGap = filteredRows.reduce((sum, row) => sum + toNum(row['Gap Caixas']), 0)

  const byOperacao = useMemo(() => countBy(filteredRows, 'Operacao'), [filteredRows])
  const byGv = useMemo(() => countBy(filteredRows, 'GV'), [filteredRows])
  const byRn = useMemo(() => countBy(filteredRows, 'RN'), [filteredRows])
  const topGaps = useMemo(() => topGapRows(filteredRows), [filteredRows])

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px clamp(14px, 4vw, 28px) 32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Dashboard
          </div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 'clamp(26px, 5vw, 34px)' }}>Leitura rapida da operacao</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Volume, cumprimento de meta e concentracao dos PDVs filtrados.
          </p>
        </div>

        <Card style={{ padding: '14px 16px', minWidth: 230 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>
            Ultima leitura
          </div>
          {lastModified ? <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{lastModified}</div> : null}
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={() => reload()} disabled={loading}>
              Atualizar
            </PrimaryButton>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <Card style={{ padding: '18px 20px' }}>
          <Field label="Base analisada">
            <SelectInput value={scope} onChange={(event) => setScope(event.target.value as BaseScope)}>
              <option value="ambas">Ambas</option>
              <option value="litrinho">Somente Litrinho</option>
              <option value="inteira">Somente Inteira</option>
            </SelectInput>
          </Field>
        </Card>

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          options={options}
          count={filteredRows.length}
          total={optionRows.length}
        />
      </div>

      {error ? (
        <Card style={{ padding: '16px 18px', marginBottom: 18, borderColor: 'rgba(180, 74, 63, .22)', background: 'var(--danger-soft)' }}>
          <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 700 }}>{error}</div>
        </Card>
      ) : null}

      {loading && !litrinhoData && !inteiraData ? (
        <Loader text="Carregando dashboard..." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
            <StatCard label="PDVs" value={totalPdvs} sub={`${scope === 'ambas' ? 'Litrinho + Inteira' : scope}`} />
            <StatCard label="Metas OK" value={metasOk} sub={`${percent(metasOk, totalPdvs)}% de acerto`} tone="var(--success)" />
            <StatCard label="Meta caixas" value={fmtNumber(totalMeta, { maximumFractionDigits: 1 })} tone="var(--accent)" />
            <StatCard label="Compradas" value={fmtNumber(totalCompradas, { maximumFractionDigits: 1 })} tone="var(--info)" />
            <StatCard label="Gap caixas" value={fmtNumber(totalGap, { maximumFractionDigits: 1 })} tone={totalGap <= 0 ? 'var(--success)' : 'var(--warning)'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 12, marginBottom: 18 }}>
            <Card style={{ padding: '18px 20px' }}>
              <SectionTitle>Meta batida</SectionTitle>
              <Donut ok={metasOk} nok={metasNok} />
            </Card>

            <Card style={{ padding: '18px 20px' }}>
              <SectionTitle>Top gaps em aberto</SectionTitle>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr>
                      {['PDV', 'Operacao', 'GV', 'Meta', 'Compradas', 'Gap'].map((label) => (
                        <th
                          key={label}
                          style={{
                            padding: '10px 8px',
                            textAlign: 'left',
                            fontSize: 11,
                            letterSpacing: 0.8,
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topGaps.length ? (
                      topGaps.map((row) => (
                        <tr key={`${row.GV}-${row.RN}-${row['Nome PDV']}`}>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{row['Nome PDV']}</td>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{row.Operacao}</td>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{row.GV}</td>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{fmtNumber(row['Meta Caixas'], { maximumFractionDigits: 1 })}</td>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{fmtNumber(row['Cxs. Compradas'], { maximumFractionDigits: 1 })}</td>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', color: 'var(--warning)', fontWeight: 800 }}>
                            {fmtNumber(row['Gap Caixas'], { maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ padding: '16px 8px', color: 'var(--muted)' }} colSpan={6}>
                          Sem gaps para exibir.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            <BarList title="PDVs por operacao" data={byOperacao} color="var(--accent)" />
            <BarList title="PDVs por GV" data={byGv} color="var(--info)" />
            <BarList title="PDVs por RN" data={byRn} color="var(--success)" />
          </div>
        </>
      )}
    </div>
  )
}
