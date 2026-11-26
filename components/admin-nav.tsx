'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { LogOut } from 'lucide-react'

type Me = { usuario: string; nombre: string; rol: 'dueno' | 'empleado'; claveDePrueba?: boolean }

const meFetcher = async (url: string): Promise<Me> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Sin sesión')
  return response.json()
}

export function AdminNav() {
  const router = useRouter()
  const { data: me } = useSWR<Me>('/api/auth/me', meFetcher, { revalidateOnFocus: false })
  const isOwner = me?.rol === 'dueno'

  // Solo lo esencial para vender. Descuentos, inventario y respaldo se manejan desde Productos.
  const main = [
    { href: '/admin', label: 'Productos' },
    { href: '/pedidos', label: 'Pedidos' },
    { href: '/reportes', label: 'Reportes' },
    { href: '/usuarios', label: isOwner ? 'Usuarios' : 'Mi cuenta' },
  ]

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav className="admin-nav" aria-label="Navegación de administración">
        {main.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        <Link href="/productos" className="admin-view-store">Ver tienda</Link>
        {me && <span className="admin-whoami" title={`Usuario: ${me.usuario}`}>{me.nombre}{isOwner ? ' · dueño' : ''}</span>}
        <button type="button" className="admin-logout" onClick={logout}><LogOut size={13} strokeWidth={1.4} aria-hidden="true" /> Cerrar sesión</button>
      </nav>
      {me?.claveDePrueba && (
        <p className="admin-warning" role="status">
          Estás usando la contraseña de prueba (<b>Admin</b>). Está bien para probar; antes de publicar la página, cámbiala en <Link href="/usuarios">Usuarios</Link>.
        </p>
      )}
    </>
  )
}
