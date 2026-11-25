'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { LogOut } from 'lucide-react'

type Me = { usuario: string; nombre: string; rol: 'dueno' | 'empleado' }

const meFetcher = async (url: string): Promise<Me> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Sin sesión')
  return response.json()
}

export function AdminNav() {
  const router = useRouter()
  const { data: me } = useSWR<Me>('/api/auth/me', meFetcher, { revalidateOnFocus: false })
  const isOwner = me?.rol === 'dueno'

  const links = [
    { href: '/admin', label: 'Panel' },
    { href: '/inventario', label: 'Inventario' },
    { href: '/pedidos', label: 'Pedidos' },
    { href: '/clientes', label: 'Clientes' },
    { href: '/reportes', label: 'Reportes' },
    { href: '/configuracion', label: 'Configuración' },
    { href: '/respaldo', label: 'Respaldo' },
    ...(isOwner ? [{ href: '/historial', label: 'Historial' }] : []),
    { href: '/usuarios', label: isOwner ? 'Usuarios' : 'Mi cuenta' },
    { href: '/productos', label: 'Ver tienda' },
  ]

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="admin-nav" aria-label="Navegación de administración">
      {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      {me && <span className="admin-whoami" title={`Usuario: ${me.usuario}`}>{me.nombre}{isOwner ? ' · dueño' : ''}</span>}
      <button type="button" className="admin-logout" onClick={logout}><LogOut size={13} strokeWidth={1.4} aria-hidden="true" /> Cerrar sesión</button>
    </nav>
  )
}
