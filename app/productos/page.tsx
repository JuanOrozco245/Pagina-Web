'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { CATEGORIES, initialProducts, isSoldOut, type Product } from '@/lib/catalog'
import { finalPrice, totalPercent, whatsappLink } from '@/lib/settings'
import { useCart } from '@/components/cart-provider'

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

export default function ProductosPage() {
  const { data: products = initialProducts } = useSWR<Product[]>('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { settings, addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  // Permite llegar con una categoría ya elegida desde el inicio (/productos?categoria=Topos).
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('categoria')
    if (wanted && (CATEGORIES as readonly string[]).includes(wanted)) setCategory(wanted)
  }, [])

  // Solo se ofrecen los filtros de categorías que ya tienen productos.
  const activeCategories = CATEGORIES.filter((item) => products.some((product) => product.category === item))
  const filtered = products.filter((product) => (category === 'Todos' || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <main className="public-shell catalog-page">
      <section className="catalog-intro">
        <div className="catalog-title-row">
          <h1>Catálogo</h1>
          <span className="catalog-total">{products.length} diseños</span>
        </div>
      </section>

      <section className="catalog-toolbar">
        <label className="search-field"><Search size={16} strokeWidth={1.4} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o descripción" aria-label="Buscar productos" /></label>
        <div className="filter-chips">
          <button type="button" className={`filter-chip ${category === 'Todos' ? 'active' : ''}`} onClick={() => setCategory('Todos')}>Todos</button>
          {activeCategories.map((item) => <button key={item} type="button" className={`filter-chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </section>
      {(query || category !== 'Todos') && <p className="catalog-count">{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</p>}
      <div className="product-grid catalog-grid">
        {filtered.map((product) => <article className="product-card" key={product.id}>
          <Link href={`/productos/${product.id}`} className="product-image-wrap"><img src={product.image} alt={product.name} className="product-image" loading="lazy" decoding="async" />{isSoldOut(product) && <span className="stock-badge">Agotado</span>}</Link>
          <div className="product-meta"><span>{product.category}</span><span>{product.price === null ? 'Consultar' : money(finalPrice(product, settings) ?? 0)}</span></div>
          {totalPercent(product, settings) > 0 && <span className="product-sale">−{totalPercent(product, settings)}%</span>}
          <h3><Link href={`/productos/${product.id}`}>{product.name}</Link></h3>
          {product.price === null ? <a className="add-link" href={whatsappLink(`Hola, quiero consultar disponibilidad y precio de ${product.name}.`, settings)} target="_blank" rel="noreferrer">Consultar <ArrowUpRight size={14} strokeWidth={1.4} /></a> : isSoldOut(product) ? <span className="sold-out">Sin stock</span> : <button type="button" className="add-link" onClick={() => addToCart(product)}>Añadir</button>}
        </article>)}
      </div>
      {filtered.length === 0 && <p className="catalog-empty">{category === 'Todos' ? 'No encontramos productos con esa búsqueda.' : `Aún no hay piezas en ${category}. Puedes escribirnos para consultar disponibilidad.`}</p>}
    </main>
  )
}
