'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GalleryIcon, MessageIcon, SparkIcon } from '@/components/nav-icons'
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
    { href: '/', label: 'Inicio', icon: SparkIcon, active: pathname === '/' && !hash, hideOnPhone: true },
    { href: '/productos', label: 'Catálogo', icon: GalleryIcon, active: pathname.startsWith('/productos') },
    { href: '/#contacto', label: 'Contacto', icon: MessageIcon, active: pathname === '/' && hash === '#contacto', cta: true },
  ]

  return (
    <header className="site-header">
      <Wordmark />
      <nav className="site-nav" aria-label="Navegación principal">
        {links.map(({ href, label, icon: Icon, active, cta, hideOnPhone }) => (
          <Link key={label} href={href} aria-label={label} className={`site-nav-link ${active ? 'is-active' : ''} ${cta ? 'is-cta' : ''} ${hideOnPhone ? 'hide-on-phone' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={18} className="nav-icon" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  )
}
