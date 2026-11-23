'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'

type OrderItem = { productId: string; name: string; quantity: number; price: number }
type Pedido = { id: string; fecha: string; nombre: string; whatsapp: string; items: OrderItem[]; subtotal: number; estado: string }

const fetcher = async (url: string): Promise<Pedido[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

export default function ClientesPage() {
  const { data: pedidos = [], error } = useSWR<Pedido[]>('/api/pedidos', fetcher, { fallbackData: [], revalidateOnFocus: true })
  const [query, setQuery] = useState('')

  const clientes = useMemo(() => {
    const map = new Map<string, { nombre: string; whatsapp: string; pedidos: number; total: number; ultimo: string }>()
    pedidos.forEach((pedido) => {
      const key = (pedido.whatsapp || pedido.nombre).toLowerCase()
      const actual = map.get(key) || { nombre: pedido.nombre, whatsapp: pedido.whatsapp, pedidos: 0, total: 0, ultimo: pedido.fecha }
      actual.pedidos += 1
      actual.total += pedido.subtotal
      if (pedido.fecha > actual.ultimo) actual.ultimo = pedido.fecha
      map.set(key, actual)
    })
    return Array.from(map.values()).sort((a, b) => b.ultimo.localeCompare(a.ultimo))
  }, [pedidos])

  const filtered = clientes.filter((cliente) => `${cliente.nombre} ${cliente.whatsapp}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">GESTIÓN LOCAL · SOLO EN ESTE EQUIPO</p><h1>Tus <em>clientes.</em></h1><p className="admin-lede">Se arman automáticamente a partir de los pedidos enviados desde la tienda.</p></div><Link href="/" className="admin-back">Ver tienda →</Link></div>
        {error && <p className="admin-notice" role="status">Abre el proyecto desde localhost para ver los clientes.</p>}
        <div className="admin-stats"><article><span>Clientes</span><strong>{clientes.length}</strong><small>Personas que enviaron una solicitud</small></article><article><span>Pedidos</span><strong>{pedidos.length}</strong><small>Solicitudes registradas</small></article><article><span>Valor total</span><strong>{money(clientes.reduce((sum, c) => sum + c.total, 0))}</strong><small>Historial completo</small></article></div>
        <div className="admin-toolbar"><div><h2>Listado</h2><p>Busca por nombre o WhatsApp.</p></div><label className="admin-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" aria-label="Buscar cliente" /></label></div>
        {filtered.length === 0 ? <p className="admin-empty">Aún no hay clientes registrados.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Pedidos</th><th>Total</th><th>Último pedido</th></tr></thead><tbody>{filtered.map((cliente) => <tr key={cliente.whatsapp || cliente.nombre}><td><strong>{cliente.nombre}</strong></td><td>{cliente.whatsapp || '—'}</td><td>{cliente.pedidos}</td><td>{money(cliente.total)}</td><td>{new Date(cliente.ultimo).toLocaleDateString('es-CO')}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  )
}
