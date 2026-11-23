'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'
import { initialProducts, type Product } from '@/lib/catalog'
import { finalPrice, initialSettings, margin, profit, type Settings } from '@/lib/settings'

type Pedido = { id: string; fecha: string; nombre: string; items: { productId: string; name: string; quantity: number; price: number; cost?: number | null }[]; subtotal: number; estado: string }
const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

export default function ReportesPage() {
  const { data: pedidos = [] } = useSWR<Pedido[]>('/api/pedidos', fetcher, { fallbackData: [], revalidateOnFocus: true })
  const { data: products = initialProducts } = useSWR<Product[]>('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { data: settings = initialSettings } = useSWR<Settings>('/api/settings', fetcher, { fallbackData: initialSettings, revalidateOnFocus: true })

  const ingresos = pedidos.reduce((sum, p) => sum + p.subtotal, 0)
  const costos = pedidos.reduce((sum, p) => sum + p.items.reduce((sub, item) => sub + (item.cost ?? 0) * item.quantity, 0), 0)
  const utilidad = ingresos - costos
  const margenReal = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0
  const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length
  const entregados = pedidos.filter((p) => p.estado === 'entregado').length

  const valorCatalogo = products.reduce((sum, p) => sum + (finalPrice(p, settings) ?? 0), 0)
  const costoCatalogo = products.reduce((sum, p) => sum + (p.cost ?? 0), 0)
  const utilidadCatalogo = products.reduce((sum, p) => sum + (profit(p, settings) ?? 0), 0)
  const margenCatalogo = valorCatalogo > 0 ? Math.round((utilidadCatalogo / valorCatalogo) * 100) : 0
  const conCosto = products.filter((p) => p.cost !== null && p.cost !== undefined).length

  const top = Object.values(pedidos.reduce<Record<string, { name: string; unidades: number; ingresos: number; costos: number }>>((acc, pedido) => {
    pedido.items.forEach((item) => {
      const actual = acc[item.productId] || { name: item.name, unidades: 0, ingresos: 0, costos: 0 }
      actual.unidades += item.quantity
      actual.ingresos += item.price * item.quantity
      actual.costos += (item.cost ?? 0) * item.quantity
      acc[item.productId] = actual
    })
    return acc
  }, {})).sort((a, b) => b.unidades - a.unidades).slice(0, 8)

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">GESTIÓN LOCAL · SOLO EN ESTE EQUIPO</p><h1>Tus <em>reportes.</em></h1><p className="admin-lede">Ventas, costos, utilidad y margen. Los datos de ventas salen de los pedidos registrados.</p></div><Link href="/" className="admin-back">Ver tienda →</Link></div>

        <div className="admin-stats"><article><span>Ingresos</span><strong>{money(ingresos)}</strong><small>Suma de pedidos</small></article><article><span>Costos</span><strong>{money(costos)}</strong><small>Costo de lo pedido</small></article><article><span>Utilidad</span><strong className="finance-value">{money(utilidad)}</strong><small>Ingresos menos costos</small></article><article><span>Margen</span><strong className="finance-value">{margenReal}%</strong><small>Sobre las ventas</small></article></div>

        <section className="report-card report-block"><div className="admin-toolbar"><div><h2>Resumen del catálogo</h2><p>Precios finales con el descuento general aplicado.</p></div><Link href="/inventario" className="admin-secondary">Editar costos en masa</Link></div><div className="report-metrics"><div><span>Valor de venta</span><strong>{money(valorCatalogo)}</strong></div><div><span>Costo total</span><strong>{money(costoCatalogo)}</strong></div><div><span>Utilidad potencial</span><strong className="finance-value">{money(utilidadCatalogo)}</strong></div><div><span>Margen promedio</span><strong className="finance-value">{margenCatalogo}%</strong></div></div><p className="report-note">{conCosto} de {products.length} productos tienen costo cargado. <Link href="/admin">Cárgalos en el panel</Link> o usa la carga masiva para ver la utilidad real.</p></section>

        <div className="report-grid">
          <section className="report-card"><h2>Piezas más pedidas</h2>{top.length === 0 ? <p className="admin-empty">Aún no hay datos.</p> : <table className="report-table"><thead><tr><th>Producto</th><th>Und.</th><th>Ingresos</th><th>Utilidad</th></tr></thead><tbody>{top.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.unidades}</td><td>{money(item.ingresos)}</td><td className="finance-value">{money(item.ingresos - item.costos)}</td></tr>)}</tbody></table>}</section>
          <section className="report-card"><h2>Pedidos por estado</h2><ul className="report-list"><li><span>Pendientes</span><strong>{pendientes}</strong></li><li><span>Enviados</span><strong>{pedidos.filter((p) => p.estado === 'enviado').length}</strong></li><li><span>Entregados</span><strong>{entregados}</strong></li></ul><p className="report-note">Los cambios de estado se hacen en la página <Link href="/pedidos">Pedidos</Link>.</p></section>
        </div>
      </section>
    </main>
  )
}
