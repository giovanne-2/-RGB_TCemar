'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BaseTab, Row } from '@/lib/sheets'
import { exportRowsAsCsv, exportVisualPdf } from '@/lib/export'
import { buildOptions, EMPTY_FILTERS, filterRows, type BaseScope, type Filters, useSheets } from '@/components/useSheets'
import {
  BaseTabs,
  Card,
  DataTable,
  Field,
  FilterBar,
  GhostButton,
  Loader,
  PrimaryButton,
  SelectInput,
} from '@/components/UI'

function getScopeRows(scope: BaseScope, litrinhoRows: Row[], inteiraRows: Row[]) {
  if (scope === 'litrinho') return litrinhoRows
  if (scope === 'inteira') return inteiraRows
  return [...litrinhoRows, ...inteiraRows]
}

export default function PlanejadorPage() {
  const { litrinhoData, inteiraData, loading, error, lastModified, load, reload } = useSheets()
  const [scope, setScope] = useState<BaseScope>('ambas')
  const [tab, setTab] = useState<BaseTab>('litrinho')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (scope !== 'ambas') setTab(scope)
  }, [scope])

  const litrinhoRows = litrinhoData?.rows ?? []
  const inteiraRows = inteiraData?.rows ?? []
  const optionRows = useMemo(() => getScopeRows(scope, litrinhoRows, inteiraRows), [scope, litrinhoRows, inteiraRows])
  const options = useMemo(() => buildOptions(optionRows), [optionRows])

  const filteredLitrinho = useMemo(() => filterRows(litrinhoRows, filters), [litrinhoRows, filters])
  const filteredInteira = useMemo(() => filterRows(inteiraRows, filters), [inteiraRows, filters])

  const activeRows = scope === 'ambas' ? (tab === 'litrinho' ? filteredLitrinho : filteredInteira) : scope === 'litrinho' ? filteredLitrinho : filteredInteira
  const totalRows = scope === 'ambas' ? filteredLitrinho.length + filteredInteira.length : activeRows.length
  const totalBaseRows = optionRows.length

  return (
    <div ref={exportRef} style={{ maxWidth: 1440, margin: '0 auto', padding: '20px clamp(14px, 4vw, 28px) 32px' }}>
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
            Planejador
          </div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 'clamp(26px, 5vw, 34px)' }}>Painel de vendas RGB</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Acompanhamento diario dos PDVs de Litrinho e Inteira.
          </p>
        </div>

        <Card style={{ padding: '14px 16px', minWidth: 230 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>
            Atualizacao
          </div>
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {lastModified ?? 'Sem horario disponivel'}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={() => reload()} disabled={loading}>
              Atualizar
            </PrimaryButton>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Field label="Base visivel">
              <SelectInput value={scope} onChange={(event) => setScope(event.target.value as BaseScope)}>
                <option value="ambas">Ambas</option>
                <option value="litrinho">Somente Litrinho</option>
                <option value="inteira">Somente Inteira</option>
              </SelectInput>
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {totalRows} de {totalBaseRows} PDVs
              </div>
              <GhostButton onClick={() => setFilters(EMPTY_FILTERS)}>Reset filtros</GhostButton>
            </div>
          </div>
        </Card>

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          options={options}
          count={totalRows}
          total={totalBaseRows}
        />
      </div>

      {error ? (
        <Card style={{ padding: '16px 18px', marginBottom: 18, borderColor: 'rgba(180, 74, 63, .22)', background: 'var(--danger-soft)' }}>
          <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 700 }}>{error}</div>
        </Card>
      ) : null}

      {loading && !litrinhoData && !inteiraData ? (
        <Loader text="Carregando planilhas..." />
      ) : (
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              padding: '18px 20px 12px',
            }}
          >
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>Base ativa</div>
              <div style={{ marginTop: 6 }}>
                <BaseTabs
                  value={scope === 'ambas' ? tab : (scope as BaseTab)}
                  onChange={setTab}
                  counts={{ litrinho: filteredLitrinho.length, inteira: filteredInteira.length }}
                />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {activeRows.length} registros na tabela
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              padding: '0 20px 14px',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>
              Exportar estado atual da aba
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <GhostButton
                onClick={() => exportRowsAsCsv(activeRows, scope, scope === 'ambas' ? tab : (scope as BaseTab))}
                disabled={!activeRows.length}
                title="Baixar CSV da tabela filtrada"
              >
                Baixar CSV
              </GhostButton>
              <PrimaryButton
                onClick={async () => {
                  if (!exportRef.current) return
                  await exportVisualPdf(exportRef.current, scope, scope === 'ambas' ? tab : (scope as BaseTab))
                }}
                disabled={!activeRows.length}
                title="Gerar PDF visual da tela filtrada"
              >
                Baixar PDF
              </PrimaryButton>
            </div>
          </div>

          <DataTable rows={activeRows} />
        </Card>
      )}
    </div>
  )
}
