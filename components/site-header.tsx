'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, LayoutGrid, MessageCircle } from 'lucide-react'
import { Wordmark } from '@/components/wordmark'
import { isAdminPath } from '@/lib/admin-routes'

export function SiteHeader() {
  const pathname = usePathname()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const update = () => setHash(window.location.hash)
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [pathname])

  if (isAdminPath(pathname)) return null

  const links = [
    { href: '/', label: 'Inicio', icon: House, active: pathname === '/' && !hash, hideOnPhone: true },
    { href: '/productos', label: 'Catálogo', icon: LayoutGrid, active: pathname.startsWith('/productos'), primary: true },
    { href: '/#contacto', label: 'Contacto', icon: MessageCircle, active: pathname === '/' && hash === '#contacto' },
  ]

  return (
    <header className="site-header">
      <Wordmark />
      <nav className="site-nav" aria-label="Navegación principal">
        {links.map(({ href, label, icon: Icon, active, primary, hideOnPhone }) => (
          <Link key={label} href={href} aria-label={label} className={`site-nav-link ${active ? 'is-active' : ''} ${primary ? 'is-primary' : ''} ${hideOnPhone ? 'hide-on-phone' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={15} strokeWidth={1.4} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  )
}
