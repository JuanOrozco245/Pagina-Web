'use client'

import { useEffect, useState, ViewTransition } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { CATEGORIES, initialProducts, type Product } from '@/lib/catalog'
import { finalPrice, whatsappLink, type Settings } from '@/lib/settings'
import { useCart } from '@/components/cart-provider'
import { flushSync } from 'react-dom'
import { PAGE_MOTION, getActivePiece, setActivePiece } from '@/lib/transitions'
import { CatalogCard, useReveal } from '@/components/catalog-card'

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
// Búsqueda sin importar tildes ni mayúsculas: "corazon" encuentra "Corazón".
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Se vuelve true después de la primera visita al catálogo. Al regresar desde una ficha, las
 * tarjetas aparecen ya visibles para que la foto pueda volver a su lugar sin parpadeos.
 */
let catalogSeen = false

type Sort = 'destacados' | 'precio-asc' | 'precio-desc' | 'nombre'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre (A–Z)' },
]

function sortProducts(list: Product[], sort: Sort, settings: Settings) {
  if (sort === 'destacados') {
    // La pieza destacada de /configuracion abre el catálogo.
    const featuredId = settings.featuredProductId
    const featured = featuredId ? list.find((product) => product.id === featuredId) : undefined
    return featured ? [featured, ...list.filter((product) => product !== featured)] : list
  }
  const sorted = [...list]
  if (sort === 'nombre') return sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  // Los productos sin precio ("Consultar") siempre quedan al final.
  return sorted.sort((a, b) => {
    const pa = finalPrice(a, settings)
    const pb = finalPrice(b, settings)
    if (pa === null && pb === null) return 0
    if (pa === null) return 1
    if (pb === null) return -1
    return sort === 'precio-asc' ? pa - pb : pb - pa
  })
}

export default function ProductosPage() {
  const { data: products = initialProducts } = useSWR<Product[]>('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { settings, addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [sort, setSort] = useState<Sort>('destacados')
  // Pieza cuya foto viaja a la ficha (y regresa a su tarjeta al volver).
  const [activeId, setActiveId] = useState(getActivePiece)
  const openPiece = (id: string) => {
    setActivePiece(id)
    // flushSync: el nombre debe estar puesto antes de que empiece la navegación.
    flushSync(() => setActiveId(id))
  }
  const [catalogSeenAtMount] = useState(catalogSeen)
  useEffect(() => { catalogSeen = true }, [])
  // Permite llegar con una categoría ya elegida desde el inicio (/productos?categoria=Topos).
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('categoria')
    if (wanted && (CATEGORIES as readonly string[]).includes(wanted)) setCategory(wanted)
  }, [])

  const countBy = (item: string) => products.filter((product) => product.category === item).length
  const needle = normalize(query.trim())
  const filtered = sortProducts(
    products.filter((product) => (category === 'Todas' || product.category === category) && normalize(`${product.name} ${product.description}`).includes(needle)),
    sort,
    settings,
  )

  return (
    <ViewTransition enter={PAGE_MOTION} exit={PAGE_MOTION} default="none">
    <main className="public-shell catalog-page zc">
      <header className="zc-head">
        <div>
          <p className="zc-eyebrow"><span className="zc-rule" aria-hidden="true" />Colección ZÉNIT</p>
          <h1>La <em>colección</em></h1>
        </div>
        <p className="zc-head-copy">Elige tu pieza y te asesoramos por WhatsApp.</p>
      </header>

      <div className="zc-bar">
        <nav className="zc-cats" aria-label="Categorías">
          {['Todas', ...CATEGORIES].map((item) => {
            const count = item === 'Todas' ? products.length : countBy(item)
            const empty = count === 0
            return (
              <button key={item} type="button" className={`zc-cat ${category === item ? 'is-active' : ''}`} aria-pressed={category === item} disabled={empty} title={empty ? 'Pronto' : undefined} onClick={() => setCategory(item)}>
                {item}<sup>{empty ? 'Pronto' : count}</sup>
              </button>
            )
          })}
        </nav>
        <div className="zc-tools">
          <span className="zc-results" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'pieza' : 'piezas'}</span>
          <label className="zc-search">
            <Search size={16} strokeWidth={1.4} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar una pieza" aria-label="Buscar productos" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={15} strokeWidth={1.4} /></button>}
          </label>
          <select className="zc-sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Ordenar">
            {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      {/* La key hace que la cuadrícula vuelva a animarse al cambiar de categoría u orden. */}
      <div className="zc-grid" key={`${category}-${sort}`}>
        {filtered.map((product, index) => <CatalogCard key={product.id} product={product} index={index} settings={settings} instant={catalogSeenAtMount} active={activeId === product.id} onOpen={() => openPiece(product.id)} onAdd={() => addToCart(product)} />)}
      </div>

      {filtered.length > 0 && !needle && <EditorialBreak settings={settings} />}

      {filtered.length === 0 && (
        <div className="zc-empty">
          <span aria-hidden="true">✦</span>
          <p>{needle ? 'No encontramos piezas con esa búsqueda.' : `Aún no hay piezas en ${category}.`}</p>
          <a href={whatsappLink('Hola, estoy buscando una pieza en el catálogo de ZENIT Joyería.', settings)} target="_blank" rel="noreferrer">Pregúntanos por WhatsApp <ArrowUpRight size={15} strokeWidth={1.4} /></a>
        </div>
      )}
    </main>
    </ViewTransition>
  )
}

function EditorialBreak({ settings }: { settings: Settings }) {
  const [ref, shown] = useReveal<HTMLElement>()
  return (
    <aside ref={ref} className={`zc-break ${shown ? 'is-in' : ''}`}>
      <span className="zc-break-mark" aria-hidden="true">✦</span>
      <p className="zc-break-quote">Detalles pequeños, <em>brillo</em> para todos los días.</p>
      <div className="zc-break-cta">
        <span>¿Buscas algo especial o un regalo?</span>
        <a href={whatsappLink('Hola, quiero asesoría para elegir una pieza de ZENIT Joyería.', settings)} target="_blank" rel="noreferrer">Te asesoramos <ArrowUpRight size={15} strokeWidth={1.4} /></a>
      </div>
    </aside>
  )
}
