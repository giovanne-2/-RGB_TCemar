import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'RGB Vendas',
  description: 'Planejamento e analise de vendas para bases Litrinho e Inteira',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main style={{ paddingTop: 80 }}>{children}</main>
      </body>
    </html>
  )
}
