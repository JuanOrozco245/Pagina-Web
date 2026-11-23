'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'

type OrderItem = { productId: string; name: string; quantity: number; price: number; cost?: number | null }
type Pedido = { id: string; fecha: string; nombre: string; whatsapp: string; items: OrderItem[]; subtotal: number; estado: string; nota?: string }
const ESTADOS = ['pendiente', 'enviado', 'entregado']
const fetcher = async (url: string): Promise<Pedido[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

export default function PedidosPage() {
  const { data: pedidos = [], error, mutate } = useSWR<Pedido[]>('/api/pedidos', fetcher, { fallbackData: [], revalidateOnFocus: true })

  const utilidadTotal = pedidos.reduce((sum, pedido) => sum + pedido.items.reduce((sub, item) => sub + (item.price - (item.cost ?? 0)) * item.quantity, 0), 0)
  const setEstado = async (id: string, estado: string) => {
    const updated = pedidos.map((pedido) => pedido.id === id ? { ...pedido, estado } : pedido)
    const response = await fetch('/api/pedidos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
    if (response.ok) await mutate(updated, { revalidate: false })
  }

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">GESTIÓN LOCAL · SOLO EN ESTE EQUIPO</p><h1>Tus <em>pedidos.</em></h1><p className="admin-lede">Cada solicitud enviada desde la bolsa queda registrada aquí. Cambia el estado a medida que avanzas.</p></div><Link href="/" className="admin-back">Ver tienda →</Link></div>
        {error && <p className="admin-notice" role="status">Abre el proyecto desde localhost para ver y guardar pedidos.</p>}
        <div className="admin-stats"><article><span>Pedidos</span><strong>{pedidos.length}</strong><small>Registrados en este equipo</small></article><article><span>Pendientes</span><strong>{pedidos.filter((p) => p.estado === 'pendiente').length}</strong><small>Por atender</small></article><article><span>Total solicitado</span><strong>{money(pedidos.reduce((sum, p) => sum + p.subtotal, 0))}</strong><small>Ingresos registrados</small></article><article><span>Utilidad</span><strong className="finance-value">{money(utilidadTotal)}</strong><small>Con los costos cargados</small></article></div>
        {pedidos.length === 0 ? <p className="admin-empty">Todavía no hay pedidos. Cuando alguien envíe una solicitud desde la bolsa, aparecerá aquí.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Utilidad</th><th>Estado</th></tr></thead><tbody>{pedidos.map((pedido) => <tr key={pedido.id}>
          <td>{new Date(pedido.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
          <td><strong>{pedido.nombre}</strong><small>{pedido.whatsapp ? `WhatsApp: ${pedido.whatsapp}` : 'Sin WhatsApp'}</small></td>
          <td><small>{pedido.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</small></td>
          <td>{money(pedido.subtotal)}</td>
          <td className="finance-value">{money(pedido.items.reduce((sum, item) => sum + (item.price - (item.cost ?? 0)) * item.quantity, 0))}</td>
          <td><select className="status-select" value={pedido.estado} onChange={(event) => setEstado(pedido.id, event.target.value)} aria-label={`Estado del pedido de ${pedido.nombre}`}>{ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select></td>
        </tr>)}</tbody></table></div>}
      </section>
    </main>
  )
}
