'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Planejador' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/resumo', label: 'Resumo' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 clamp(14px, 4vw, 28px)',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 10px 35px rgba(66, 137, 212, 0.08)',
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 8, flex: '0 0 auto' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #4bb8ff, var(--accent))',
            color: '#fff',
            fontWeight: 900,
            letterSpacing: 0.6,
            boxShadow: '0 14px 28px rgba(29, 109, 255, 0.28)',
          }}
        >
          RGB
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>RGB Vendas</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Litrinho e Inteira</div>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: '10px 15px',
                borderRadius: 999,
                border: `1px solid ${active ? 'rgba(29, 109, 255, .16)' : 'transparent'}`,
                background: active ? '#ffffff' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 8px 22px rgba(80, 145, 219, 0.12)' : 'none',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
