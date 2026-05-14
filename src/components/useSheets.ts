'use client'

import { useCallback, useRef, useState } from 'react'
import type { Row, SheetData } from '@/lib/sheets'

const CACHE_TTL_MS = 60_000

export type BaseScope = 'ambas' | 'litrinho' | 'inteira'

export interface Filters {
  gv: string
  rn: string
  operacao: string
  bateuMeta: string
  busca: string
}

export const EMPTY_FILTERS: Filters = {
  gv: '',
  rn: '',
  operacao: '',
  bateuMeta: '',
  busca: '',
}

interface ApiData {
  litrinho: SheetData
  inteira: SheetData
  lastModified: string | null
  error: string | null
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function isMetaOk(value: string): boolean {
  const normalized = normalize(value.trim())
  return ['ok', '1', 'true', 'sim'].includes(normalized)
}

export function filterRows(rows: Row[], filters: Filters): Row[] {
  const search = normalize(filters.busca)

  return rows.filter((row) => {
    if (filters.gv && row.GV !== filters.gv) return false
    if (filters.rn && row.RN !== filters.rn) return false
    if (filters.operacao && row.Operacao !== filters.operacao) return false
    if (filters.bateuMeta === 'ok' && !isMetaOk(row['Bateu Meta'])) return false
    if (filters.bateuMeta === 'nok' && isMetaOk(row['Bateu Meta'])) return false

    if (search) {
      const haystack = [
        row.GV,
        row.RN,
        row['Nome PDV'],
        row.Base,
        row.Operacao,
        row['Data Visita'],
      ]
        .map(normalize)
        .join(' ')

      if (!haystack.includes(search)) return false
    }

    return true
  })
}

export function uniqueValues(rows: Row[], key: keyof Row): string[] {
  return Array.from(new Set(rows.map((row) => row[key]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true }),
  )
}

export function buildOptions(rows: Row[]) {
  return {
    gv: uniqueValues(rows, 'GV'),
    rn: uniqueValues(rows, 'RN'),
    operacao: uniqueValues(rows, 'Operacao'),
  }
}

let cache: { data: ApiData; ts: number } | null = null
let pending: Promise<ApiData> | null = null

export function useSheets() {
  const [litrinhoData, setLitrinhoData] = useState<SheetData | null>(cache?.data.litrinho ?? null)
  const [inteiraData, setInteiraData] = useState<SheetData | null>(cache?.data.inteira ?? null)
  const [lastModified, setLastModified] = useState<string | null>(cache?.data.lastModified ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(cache?.data.error ?? null)
  const fetching = useRef(false)

  const applyData = useCallback((data: ApiData) => {
    setLitrinhoData(data.litrinho)
    setInteiraData(data.inteira)
    setLastModified(data.lastModified)
    setError(data.error)
  }, [])

  const load = useCallback(
    async (force = false) => {
      const cached = cache
      const cacheFresh = cached && Date.now() - cached.ts < CACHE_TTL_MS
      if (cacheFresh && !force) {
        applyData(cached.data)
        return
      }

      if (pending && !force) {
        setLoading(true)
        try {
          applyData(await pending)
        } finally {
          setLoading(false)
        }
        return
      }

      if (fetching.current) return
      fetching.current = true
      setLoading(true)
      setError(null)

      pending = (async () => {
        const response = await fetch(`/api/sheets${force ? '?refresh=1' : ''}`)
        const json = (await response.json()) as ApiData

        if (!response.ok || json.error) {
          throw new Error(json.error || `HTTP ${response.status}`)
        }

        cache = { data: json, ts: Date.now() }
        return json
      })()

      try {
        applyData(await pending)
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : String(loadError)
        setError(message)
      } finally {
        setLoading(false)
        fetching.current = false
        pending = null
      }
    },
    [applyData],
  )

  const reload = useCallback(() => {
    cache = null
    return load(true)
  }, [load])

  return {
    litrinhoData,
    inteiraData,
    lastModified,
    loading,
    error,
    load,
    reload,
  }
}
