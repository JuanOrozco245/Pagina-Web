'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { Wordmark } from '@/components/wordmark'
import { isAdminPath } from '@/lib/admin-routes'
import { whatsappLink } from '@/lib/settings'

const explore = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/productos' },
  { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
]

const policies = [
  { label: 'Compras y pagos', href: '/informacion#compras' },
  { label: 'Envíos', href: '/informacion#envios' },
  { label: 'Cambios y devoluciones', href: '/informacion#devoluciones' },
  { label: 'Privacidad', href: '/informacion#privacidad' },
  { label: 'Términos y condiciones', href: '/informacion#terminos' },
]

export function SiteFooter() {
  const { settings } = useCart()
  const pathname = usePathname()
  // El panel privado no lleva el pie de página de la tienda.
  if (isAdminPath(pathname)) return null

  return (
    <footer className="site-footer">
      <div className="footer-inner footer-inner-compact">
        <div className="footer-brand">
          <Wordmark className="footer-wordmark" />
          <p>Detalles dorados para brillar a tu manera.</p>
        </div>

        <nav className="footer-column" aria-label="Enlaces de la tienda">
          <h3>Explorar</h3>
          {explore.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          {settings.whatsapp && <a href={whatsappLink('Hola, quiero contactar con ZENIT Joyería', settings)} target="_blank" rel="noreferrer" className="footer-contact-link">WhatsApp <ArrowUpRight size={12} aria-hidden="true" /></a>}
        </nav>

        <nav className="footer-column" aria-label="Información comercial">
          <h3>Información</h3>
          {policies.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© 2026 ZENIT Joyería</span>
        <span>Precios en pesos colombianos (COP)</span>
        <Link href="/admin" className="footer-admin">Acceso al panel</Link>
      </div>
    </footer>
  )
}
