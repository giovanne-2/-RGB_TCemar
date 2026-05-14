export const SOURCE_COLS = [
  'GV',
  'RN',
  'Nome PDV',
  'Base',
  'Unb Pdv',
  'Data Visita',
  'Meta Caixas',
  'Cxs. Compradas',
  'Bateu Meta',
  'Gap Caixas',
] as const

export const DISPLAY_COLS = [
  'GV',
  'RN',
  'Nome PDV',
  'Base',
  'Operacao',
  'Data Visita',
  'Meta Caixas',
  'Cxs. Compradas',
  'Bateu Meta',
  'Gap Caixas',
] as const

export type DisplayCol = (typeof DISPLAY_COLS)[number]
export type BaseTab = 'litrinho' | 'inteira'

export interface Row {
  GV: string
  RN: string
  'Nome PDV': string
  Base: string
  Operacao: string
  'Data Visita': string
  'Meta Caixas': string
  'Cxs. Compradas': string
  'Bateu Meta': string
  'Gap Caixas': string
}

export interface SheetData {
  rows: Row[]
}

const UNB_MAP: Record<string, string> = {
  '295370': 'Temar',
  '599719': 'Cemar Di',
  '1863002': 'Cemar Gu',
}

function transformOperacao(raw: string): string {
  const base = raw.trim()
  const code = (base.split('_')[0] ?? '').trim()
  if (!code) return base
  return UNB_MAP[code] ?? code
}

function transformBateuMeta(raw: string): string {
  const value = raw.trim().toLowerCase()
  if (['1', 'true', 'sim', 'ok'].includes(value)) return 'OK'
  if (['0', 'false', 'nao', 'nok'].includes(value)) return 'NOK'
  return raw.trim().toUpperCase()
}

function parseCSVMatrix(text: string): string[][] {
  const rows: string[][] = []
  let cells: string[] = []
  let current = ''
  let inQuotes = false

  const pushCell = () => {
    cells.push(current.trim())
    current = ''
  }

  const pushRow = () => {
    if (cells.some((cell) => cell.trim()) || current.trim()) {
      pushCell()
      rows.push(cells)
    }
    cells = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      pushCell()
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      pushRow()
      continue
    }

    current += char
  }

  pushRow()
  return rows
}

export function parseCSV(csv: string): Row[] {
  const rows = parseCSVMatrix(csv)
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => header.replace(/^"|"$/g, '').trim())
  const indexByHeader: Record<string, number> = {}
  headers.forEach((header, index) => {
    indexByHeader[header] = index
  })

  const get = (cells: string[], col: string) => {
    const index = indexByHeader[col]
    return index === undefined ? '' : (cells[index] ?? '').trim()
  }

  return rows
    .slice(1)
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells) => ({
      GV: get(cells, 'GV'),
      RN: get(cells, 'RN'),
      'Nome PDV': get(cells, 'Nome PDV'),
      Base: get(cells, 'Base'),
      Operacao: transformOperacao(get(cells, 'Unb Pdv')),
      'Data Visita': get(cells, 'Data Visita'),
      'Meta Caixas': get(cells, 'Meta Caixas'),
      'Cxs. Compradas': get(cells, 'Cxs. Compradas'),
      'Bateu Meta': transformBateuMeta(get(cells, 'Bateu Meta')),
      'Gap Caixas': get(cells, 'Gap Caixas'),
    }))
    .filter((row) => row['Nome PDV'] || row.GV)
}

export function toNum(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = value.trim()
  if (!raw) return 0

  let normalized = raw.replace(/[^\d,.-]/g, '')
  if (/^-?[\d.]+,\d+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = normalized.replace(/\.(?=\d{3}(?:[.,]|$))/g, '').replace(',', '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function fmtNumber(
  value: string | number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 0 },
): string {
  if (typeof value === 'string' && !value.trim()) return '-'
  return new Intl.NumberFormat('pt-BR', options).format(toNum(value))
}
