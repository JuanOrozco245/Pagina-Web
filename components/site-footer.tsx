'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Camera, MessageCircle } from 'lucide-react'
import { Wordmark } from '@/components/wordmark'
import { useCart } from '@/components/cart-provider'
import { isAdminPath } from '@/lib/admin-routes'
import { whatsappLink } from '@/lib/settings'

const explore = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/productos' },
  { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
]

const policies = [
  { label: 'Política de privacidad', href: '/informacion#privacidad' },
  { label: 'Términos y condiciones', href: '/informacion#terminos' },
  { label: 'Compras y pagos', href: '/informacion#compras' },
  { label: 'Envíos', href: '/informacion#envios' },
  { label: 'Cambios y devoluciones', href: '/informacion#devoluciones' },
]

export function SiteFooter() {
  const { settings } = useCart()
  const pathname = usePathname()
  // El panel privado no lleva el pie de página de la tienda.
  if (isAdminPath(pathname)) return null

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Wordmark className="footer-wordmark" />
          <p>Detalles dorados para brillar a tu manera.</p>
          <p className="footer-brand-note">Una selección pensada para regalar, combinar y hacer tuya.</p>
        </div>

        <nav className="footer-column" aria-label="Enlaces de la tienda">
          <h3>Explorar</h3>
          {explore.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>

        <div className="footer-column">
          <h3>Contacto</h3>
          {settings.whatsapp ? (
            <a href={whatsappLink('Hola, quiero contactar con ZENIT Joyería', settings)} target="_blank" rel="noreferrer" className="footer-contact-link"> WhatsApp <ArrowUpRight size={12} aria-hidden="true" /></a>
          ) : (
            <p>WhatsApp <span className="footer-pending">pendiente de configurar</span></p>
          )}
          <p>Correo <span className="footer-pending">pendiente</span></p>
          <p>Dirección <span className="footer-pending">pendiente</span></p>
          <p>Horarios <span className="footer-pending">pendiente</span></p>
          <Link href="/#contacto" className="footer-contact-link">Ver contacto <MessageCircle size={12} aria-hidden="true" /></Link>
        </div>

        <nav className="footer-column" aria-label="Información comercial">
          <h3>Comprar con confianza</h3>
          {policies.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>

        <div className="footer-column">
          <h3>Redes sociales</h3>
          <p><Camera size={12} aria-hidden="true" /> Instagram <span className="footer-pending">sin enlace</span></p>
          <p className="footer-column-note">Agrega aquí los enlaces oficiales cuando estén disponibles.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 ZENIT Joyería</span>
        <span>Diseño y desarrollo: <span className="footer-pending">pendiente de acreditar</span></span>
        <span>Precios en pesos colombianos (COP)</span>
        <Link href="/admin" className="footer-admin">Acceso al panel</Link>
      </div>
    </footer>
  )
}
