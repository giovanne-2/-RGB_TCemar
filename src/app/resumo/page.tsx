'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Row } from '@/lib/sheets'
import { fmtNumber, toNum } from '@/lib/sheets'
import { buildOptions, EMPTY_FILTERS, filterRows, isMetaOk, type BaseScope, type Filters, useSheets } from '@/components/useSheets'
import { Card, Field, FilterBar, Loader, PrimaryButton, SectionTitle, SelectInput, StatCard } from '@/components/UI'

type GroupKey = 'GV' | 'RN' | 'Operacao' | 'Base'

function getScopeRows(scope: BaseScope, litrinhoRows: Row[], inteiraRows: Row[]) {
  if (scope === 'litrinho') return litrinhoRows
  if (scope === 'inteira') return inteiraRows
  return [...litrinhoRows, ...inteiraRows]
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

export default function ResumoPage() {
  const { litrinhoData, inteiraData, loading, error, lastModified, load, reload } = useSheets()
  const [scope, setScope] = useState<BaseScope>('ambas')
  const [groupKey, setGroupKey] = useState<GroupKey>('Operacao')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  useEffect(() => {
    load()
  }, [load])

  const litrinhoRows = litrinhoData?.rows ?? []
  const inteiraRows = inteiraData?.rows ?? []
  const optionRows = useMemo(() => getScopeRows(scope, litrinhoRows, inteiraRows), [scope, litrinhoRows, inteiraRows])
  const options = useMemo(() => buildOptions(optionRows), [optionRows])
  const filteredRows = useMemo(() => filterRows(optionRows, filters), [optionRows, filters])

  const summaryRows = useMemo(() => {
    const groups = new Map<string, Row[]>()

    filteredRows.forEach((row) => {
      const key = row[groupKey] || '(vazio)'
      const current = groups.get(key) ?? []
      current.push(row)
      groups.set(key, current)
    })

    return Array.from(groups.entries())
      .map(([label, rows]) => {
        const metasOk = rows.filter((row) => isMetaOk(row['Bateu Meta'])).length
        const totalMeta = rows.reduce((sum, row) => sum + toNum(row['Meta Caixas']), 0)
        const totalCompradas = rows.reduce((sum, row) => sum + toNum(row['Cxs. Compradas']), 0)
        const totalGap = rows.reduce((sum, row) => sum + toNum(row['Gap Caixas']), 0)

        return {
          label,
          total: rows.length,
          metasOk,
          hitRate: percent(metasOk, rows.length),
          totalMeta,
          totalCompradas,
          totalGap,
        }
      })
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'pt-BR', { numeric: true }))
  }, [filteredRows, groupKey])

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
            Resumo
          </div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 'clamp(26px, 5vw, 34px)' }}>Consolidado por grupo</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Compare performance por operacao, GV, RN ou base.
          </p>
        </div>

        <Card style={{ padding: '14px 16px', minWidth: 230 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>
            Ultima leitura
          </div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{lastModified ?? 'Sem horario disponivel'}</div>
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={() => reload()} disabled={loading}>
              Atualizar
            </PrimaryButton>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <Card style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="Base analisada">
            <SelectInput value={scope} onChange={(event) => setScope(event.target.value as BaseScope)}>
              <option value="ambas">Ambas</option>
              <option value="litrinho">Somente Litrinho</option>
              <option value="inteira">Somente Inteira</option>
            </SelectInput>
          </Field>

          <Field label="Agrupar por">
            <SelectInput value={groupKey} onChange={(event) => setGroupKey(event.target.value as GroupKey)}>
              <option value="Operacao">Operacao</option>
              <option value="GV">GV</option>
              <option value="RN">RN</option>
              <option value="Base">Base</option>
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
        <Loader text="Carregando resumo..." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
            <StatCard label="Linhas filtradas" value={filteredRows.length} />
            <StatCard label="Grupos" value={summaryRows.length} tone="var(--accent)" />
            <StatCard
              label="Meta caixas"
              value={fmtNumber(filteredRows.reduce((sum, row) => sum + toNum(row['Meta Caixas']), 0), {
                maximumFractionDigits: 1,
              })}
              tone="var(--info)"
            />
            <StatCard
              label="Compradas"
              value={fmtNumber(filteredRows.reduce((sum, row) => sum + toNum(row['Cxs. Compradas']), 0), {
                maximumFractionDigits: 1,
              })}
              tone="var(--success)"
            />
          </div>

          <Card style={{ padding: '18px 20px' }}>
            <SectionTitle>Resumo por {groupKey}</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[groupKey, 'PDVs', 'Metas OK', 'Hit %', 'Meta', 'Compradas', 'Gap'].map((label) => (
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
                  {summaryRows.length ? (
                    summaryRows.map((row) => (
                      <tr key={row.label}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>{row.label}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{row.total}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', color: 'var(--success)', fontWeight: 700 }}>
                          {row.metasOk}
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{row.hitRate}%</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                          {fmtNumber(row.totalMeta, { maximumFractionDigits: 1 })}
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                          {fmtNumber(row.totalCompradas, { maximumFractionDigits: 1 })}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderBottom: '1px solid var(--border)',
                            color: row.totalGap <= 0 ? 'var(--success)' : 'var(--warning)',
                            fontWeight: 700,
                          }}
                        >
                          {fmtNumber(row.totalGap, { maximumFractionDigits: 1 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={{ padding: '16px 8px', color: 'var(--muted)' }} colSpan={7}>
                        Sem dados para resumir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
