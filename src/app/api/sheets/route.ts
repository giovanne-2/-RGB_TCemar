import { NextRequest, NextResponse } from 'next/server'
import { parseCSV } from '@/lib/sheets'

const SHEET_ID =
  process.env.SHEETS_SHEET_ID ?? '1t348ONQzN0l_ByyKiKbJqPhiZbVf4D77coh00HYzYI4'

const GID_LITRINHO = process.env.GID_LITRINHO ?? '0'
const GID_INTEIRA = process.env.GID_INTEIRA ?? '1551386301'
const REVALIDATE_SECONDS = Number(process.env.SHEETS_REVALIDATE_SECONDS ?? 60)

function csvUrl(gid: string): string {
  const base = process.env.SHEETS_BASE_URL ?? `https://docs.google.com/spreadsheets/d/${SHEET_ID}`
  return `${base}/export?format=csv&gid=${gid}`
}

async function fetchSheet(gid: string, label: string, forceFresh: boolean) {
  const response = await fetch(
    csvUrl(gid),
    forceFresh ? { cache: 'no-store' } : { next: { revalidate: REVALIDATE_SECONDS } },
  )

  if (!response.ok) {
    throw new Error(`Erro ao buscar ${label}: HTTP ${response.status}`)
  }

  return {
    rows: parseCSV(await response.text()),
    lastModified: response.headers.get('last-modified'),
  }
}

function pickLastModified(a: string | null, b: string | null) {
  const toMs = (value: string | null) => (value ? new Date(value).getTime() : 0)
  return toMs(a) >= toMs(b) ? a : b
}

function formatLastModified(value: string | null) {
  if (!value) return null
  try {
    return new Date(value).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export async function GET(req: NextRequest) {
  const forceFresh = req.nextUrl.searchParams.get('refresh') === '1'

  try {
    const [litrinho, inteira] = await Promise.all([
      fetchSheet(GID_LITRINHO, 'Litrinho', forceFresh),
      fetchSheet(GID_INTEIRA, 'Inteira', forceFresh),
    ])

    const lastModified = formatLastModified(
      pickLastModified(litrinho.lastModified, inteira.lastModified),
    )

    return NextResponse.json(
      {
        litrinho: { rows: litrinho.rows },
        inteira: { rows: inteira.rows },
        lastModified,
        error: null,
      },
      {
        headers: {
          'Cache-Control': forceFresh
            ? 'no-store'
            : `s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300`,
        },
      },
    )
  } catch (error: unknown) {
    return NextResponse.json(
      {
        litrinho: { rows: [] },
        inteira: { rows: [] },
        lastModified: null,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
