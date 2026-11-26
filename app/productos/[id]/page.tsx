'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Plus } from 'lucide-react'
import { initialProducts, isSoldOut, type Product } from '@/lib/catalog'
import { finalPrice, totalPercent, whatsappLink } from '@/lib/settings'
import { useCart } from '@/components/cart-provider'

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>()
  const { data: products = initialProducts } = useSWR('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { settings, addToCart } = useCart()
  const product = products.find((item) => item.id === params.id)

  if (!product) return <main className="public-shell"><section className="catalog-intro"><h1>Producto no encontrado</h1><Link href="/productos" className="underlined-link"><ArrowLeft size={14} /> Volver al catálogo</Link></section></main>

  const related = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4)

  return (
    <main className="public-shell">
      <section className="detail-wrap">
        <Link href="/productos" className="underlined-link detail-back"><ArrowLeft size={14} /> Volver al catálogo</Link>
        <div className="detail-grid">
          <div className="detail-image"><img src={product.image} alt={product.name} /></div>
          <div className="detail-info">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="detail-description">{product.description}</p>
            <div className="detail-price">{product.price === null ? <span>Consultar precio</span> : <><strong>{money(finalPrice(product, settings) ?? 0)}</strong>{totalPercent(product, settings) > 0 && <><del>{money(product.price)}</del><span className="detail-discount">−{totalPercent(product, settings)}%</span></>}</>}</div>
            <p className="detail-stock">{product.stock === null || product.stock === undefined ? 'Disponible bajo pedido' : product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado por ahora'}</p>
            <div className="detail-actions">
              {product.price !== null && !isSoldOut(product) && <button className="detail-add" onClick={() => addToCart(product)}><Plus size={16} /> Añadir</button>}
              <a className="detail-whatsapp" href={whatsappLink(`Hola, quiero consultar disponibilidad de ${product.name}.`, settings)} target="_blank" rel="noreferrer">Consultar por WhatsApp <ArrowUpRight size={14} /></a>
            </div>
            <p className="detail-note">Los detalles de entrega se coordinan personalmente. Precios en pesos colombianos.</p>
          </div>
        </div>
      </section>
      {related.length > 0 && <section className="detail-related"><h2>También te puede gustar</h2><div className="product-grid">{related.map((item) => <article className="product-card" key={item.id}><Link href={`/productos/${item.id}`} className="product-image-wrap"><img src={item.image} alt={item.name} className="product-image" /></Link><h3><Link href={`/productos/${item.id}`}>{item.name}</Link></h3><p className="product-meta"><span>{item.category}</span><span>{item.price === null ? 'Consultar' : money(finalPrice(item, settings) ?? 0)}</span></p></article>)}</div></section>}
    </main>
  )
}
