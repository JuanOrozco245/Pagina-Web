'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

const links = [
  { href: '/admin', label: 'Panel' },
  { href: '/inventario', label: 'Inventario' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/reportes', label: 'Reportes' },
  { href: '/configuracion', label: 'Configuración' },
  { href: '/respaldo', label: 'Respaldo' },
  { href: '/productos', label: 'Ver tienda' },
]

export function AdminNav() {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="admin-nav" aria-label="Navegación de administración">
      {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      <button type="button" className="admin-logout" onClick={logout}><LogOut size={13} strokeWidth={1.4} aria-hidden="true" /> Cerrar sesión</button>
    </nav>
  )
}
