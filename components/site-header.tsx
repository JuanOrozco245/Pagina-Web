'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gem, House, LayoutGrid, MessageCircle, ShoppingBag, Sparkles } from 'lucide-react'
import { useCart } from '@/components/cart-provider'

const ADMIN_PREFIXES = ['/admin', '/configuracion', '/inventario', '/pedidos', '/clientes', '/reportes', '/respaldo', '/login']

export function SiteHeader() {
  const pathname = usePathname()
  const { count, openCart } = useCart()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const update = () => setHash(window.location.hash)
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [pathname])

  if (ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null

  const links = [
    { href: '/', label: 'Inicio', icon: House, active: pathname === '/' && !hash },
    { href: '/productos', label: 'Catálogo', icon: LayoutGrid, active: pathname.startsWith('/productos') },
    { href: '/#destacados', label: 'Best Sellers', icon: Sparkles, active: pathname === '/' && hash === '#destacados' },
    { href: '/#contacto', label: 'Contacto', icon: MessageCircle, active: pathname === '/' && hash === '#contacto' },
  ]

  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="ZENIT Joyería, inicio">
        <span className="wordmark-mark" aria-hidden="true"><Gem size={21} strokeWidth={1.15} /><span className="wordmark-spark">✦</span></span>
        <span className="wordmark-type"><span className="wordmark-name">ZÉNIT</span><small>JOYERÍA</small></span>
      </Link>
      <nav className="site-nav" aria-label="Navegación principal">
        {links.map(({ href, label, icon: Icon, active }) => (
          <Link key={label} href={href} className={`site-nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={15} strokeWidth={1.4} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <button className="bag-button" onClick={openCart} aria-label={`Abrir carrito, ${count} artículos`}>
        <ShoppingBag size={16} strokeWidth={1.4} aria-hidden="true" />
        <span className="bag-label">Bolsa</span>
        <span className="bag-count">{count}</span>
      </button>
    </header>
  )
}
