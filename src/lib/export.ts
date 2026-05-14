import { DISPLAY_COLS, type BaseTab, type Row } from '@/lib/sheets'
import type { BaseScope } from '@/components/useSheets'

function escapeCsvCell(value: string) {
  const normalized = value.replace(/"/g, '""')
  return `"${normalized}"`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function timestampForFile() {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}_${pad2(now.getHours())}-${pad2(now.getMinutes())}`
}

function currentBaseLabel(scope: BaseScope, tab: BaseTab) {
  if (scope === 'litrinho') return 'litrinho'
  if (scope === 'inteira') return 'inteira'
  return tab
}

export function exportRowsAsCsv(rows: Row[], scope: BaseScope, tab: BaseTab) {
  const headers = [...DISPLAY_COLS]
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ]

  const blob = new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `rgb_${currentBaseLabel(scope, tab)}_${timestampForFile()}.csv`)
}

function waitForImageLoad(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Falha ao gerar imagem do painel.'))
    image.src = src
  })
}

function buildSnapshotMarkup(target: HTMLElement) {
  const clone = target.cloneNode(true) as HTMLElement
  clone.style.width = `${target.scrollWidth}px`
  clone.style.margin = '0'

  return `
    <div xmlns="http://www.w3.org/1999/xhtml"
      style="
        width:${target.scrollWidth}px;
        padding:20px;
        box-sizing:border-box;
        background:
          radial-gradient(circle at 12% 18%, rgba(174, 231, 255, 0.92), transparent 22%),
          radial-gradient(circle at 82% 12%, rgba(196, 243, 232, 0.72), transparent 18%),
          radial-gradient(circle at 74% 68%, rgba(214, 236, 255, 0.88), transparent 20%),
          linear-gradient(180deg, #f6fcff 0%, #ecf8ff 48%, #e7f8f6 100%);
        font-family:Aptos, Avenir, 'Segoe UI', sans-serif;
        color:#16345f;
      "
    >
      ${clone.outerHTML}
    </div>
  `
}

async function renderElementToCanvas(target: HTMLElement) {
  const width = Math.ceil(target.scrollWidth + 40)
  const height = Math.ceil(target.scrollHeight + 40)
  const markup = buildSnapshotMarkup(target)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${markup}
      </foreignObject>
    </svg>
  `

  const image = await waitForImageLoad(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Nao foi possivel preparar canvas para PDF.')

  context.scale(scale, scale)
  context.drawImage(image, 0, 0, width, height)
  return canvas
}

function splitCanvasIntoPages(canvas: HTMLCanvasElement) {
  const pageAspectRatio = 1.414
  const pageWidth = canvas.width
  const pageHeight = Math.floor(pageWidth * pageAspectRatio)
  const pages: string[] = []

  for (let offsetY = 0; offsetY < canvas.height; offsetY += pageHeight) {
    const sliceHeight = Math.min(pageHeight, canvas.height - offsetY)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = pageWidth
    pageCanvas.height = sliceHeight

    const pageContext = pageCanvas.getContext('2d')
    if (!pageContext) continue

    pageContext.fillStyle = '#ffffff'
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    pageContext.drawImage(
      canvas,
      0,
      offsetY,
      pageWidth,
      sliceHeight,
      0,
      0,
      pageWidth,
      sliceHeight,
    )

    pages.push(pageCanvas.toDataURL('image/png'))
  }

  return pages
}

function printPages(pages: string[], filename: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    throw new Error('Seu navegador bloqueou janela para gerar PDF.')
  }

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #dfeffd;
            font-family: Aptos, Avenir, 'Segoe UI', sans-serif;
          }
          .page {
            width: 210mm;
            margin: 0 auto;
            padding: 8mm;
            page-break-after: always;
          }
          .page:last-child { page-break-after: auto; }
          img {
            width: 100%;
            display: block;
            border-radius: 10px;
            box-shadow: 0 12px 30px rgba(41, 108, 176, 0.12);
            background: white;
          }
          @media print {
            body { background: white; }
            .page { padding: 0; width: auto; }
            img { border-radius: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        ${pages.map((src) => `<div class="page"><img src="${src}" alt="Exportacao visual" /></div>`).join('')}
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
            }, 250);
          });
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

export async function exportVisualPdf(target: HTMLElement, scope: BaseScope, tab: BaseTab) {
  const canvas = await renderElementToCanvas(target)
  const pages = splitCanvasIntoPages(canvas)
  const filename = `rgb_${currentBaseLabel(scope, tab)}_${timestampForFile()}.pdf`
  printPages(pages, filename)
}
