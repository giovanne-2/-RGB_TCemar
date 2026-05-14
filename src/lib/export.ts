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

function collectPrintStyles() {
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n')
}

export async function exportVisualPdf(target: HTMLElement, scope: BaseScope, tab: BaseTab) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    throw new Error('Seu navegador bloqueou a janela de impressao.')
  }

  const clone = target.cloneNode(true) as HTMLElement
  clone.style.maxWidth = 'none'
  clone.style.width = '100%'
  clone.style.margin = '0'
  clone.style.padding = '20px'

  const filename = `rgb_${currentBaseLabel(scope, tab)}_${timestampForFile()}`
  const headStyles = collectPrintStyles()

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${filename}</title>
        ${headStyles}
        <style>
          body {
            margin: 0;
            background:
              radial-gradient(circle at 12% 18%, rgba(174, 231, 255, 0.92), transparent 22%),
              radial-gradient(circle at 82% 12%, rgba(196, 243, 232, 0.72), transparent 18%),
              radial-gradient(circle at 74% 68%, rgba(214, 236, 255, 0.88), transparent 20%),
              linear-gradient(180deg, #f6fcff 0%, #ecf8ff 48%, #e7f8f6 100%);
          }
          .print-shell {
            padding: 16px;
          }
          .print-root {
            width: 1480px;
            margin: 0 auto;
          }
          @page {
            size: landscape;
            margin: 10mm;
          }
          @media print {
            body {
              background: white !important;
            }
            .print-shell {
              padding: 0;
            }
            .print-root {
              width: auto;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-shell">
          <div class="print-root">${clone.outerHTML}</div>
        </div>
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => window.print(), 300);
          });
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
