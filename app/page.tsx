'use client'

import { useEffect, useRef, useState, ViewTransition } from 'react'
import { flushSync } from 'react-dom'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { initialProducts, type Product } from '@/lib/catalog'
import { whatsappLink } from '@/lib/settings'
import { useCart } from '@/components/cart-provider'
import { CatalogCard } from '@/components/catalog-card'
import { PAGE_MOTION, getActivePiece, setActivePiece } from '@/lib/transitions'

const fetchCatalog = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Local catalog is available only on localhost.')
  return response.json()
}

function FineArrow() { return <ArrowRight aria-hidden="true" size={16} strokeWidth={1.4} /> }

export default function Home() {
  const { data: products = initialProducts } = useSWR('/api/catalog', fetchCatalog, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { settings, addToCart } = useCart()
  const [cursorText, setCursorText] = useState('')
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  // Cursor dorado personalizado: solo con mouse.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const move = (event: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  // Pieza cuya foto viaja a la ficha al abrirla desde los best sellers.
  const [activeId, setActiveId] = useState(getActivePiece)
  const openPiece = (id: string) => {
    setActivePiece(id)
    flushSync(() => setActiveId(id))
  }

  // Los bestsellers son los primeros productos del catálogo. El orden se cambia en /admin.
  const featured = products.slice(0, 5)
  // Franja de fotos: una por imagen distinta; la pieza destacada de /configuracion va primero.
  const unique = products.filter((product, index, all) => product.image && all.findIndex((other) => other.image === product.image) === index)
  const highlight = unique.find((product) => product.id === settings.featuredProductId)
  const strip = highlight ? [highlight, ...unique.filter((product) => product !== highlight)] : unique
  const contactLink = whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)

  return (
    <ViewTransition enter={PAGE_MOTION} exit={PAGE_MOTION} default="none">
    <main className="home-page">
      <div className="cursor-dot" ref={cursorRef} aria-hidden="true" />
      <div className={`cursor-ring ${cursorText ? 'cursor-ring-active' : ''}`} ref={ringRef} aria-hidden="true">{cursorText}</div>

      {/* Portada a pantalla completa: el anillo a la derecha, el mensaje a la izquierda */}
      <section className="hx">
        <div className="hx-visual" role="img" aria-label="Anillo dorado con diamante" />
        <span className="hx-glow" aria-hidden="true" />
        <span className="hx-sweep" aria-hidden="true" />
        <div className="hx-content">
          <p className="hx-eyebrow"><span aria-hidden="true" />Joyería en oro</p>
          <h1><span>Detalles que</span> <em>brillan contigo.</em></h1>
          <p className="hx-lede">Joyas en oro para regalar, para celebrar y para ti.</p>
          <div className="hx-actions">
            <Link href="/productos" className="hx-primary" onMouseEnter={() => setCursorText('Ver')} onMouseLeave={() => setCursorText('')}>Ver catálogo <FineArrow /></Link>
            <a href={contactLink} className="hx-secondary" target="_blank" rel="noreferrer">Escríbenos por WhatsApp <ArrowUpRight size={14} strokeWidth={1.4} /></a>
          </div>
          <ul className="hx-facts" aria-label="Lo que ofrecemos">
            <li><strong>{products.length}</strong> diseños</li>
            <li>Asesoría por WhatsApp</li>
            <li>Entrega coordinada contigo</li>
          </ul>
        </div>
      </section>

      {/* Franja de piezas en movimiento continuo; se detiene al pasar el ratón */}
      {strip.length > 0 && (
        <section className="hx-strip" id="coleccion" aria-label="Piezas de la colección">
          <div className="hx-strip-track">
            {[0, 1].map((copy) => (
              <div className="hx-strip-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                {strip.map((product) => (
                  <Link key={product.id} href={`/productos/${product.id}`} className="hx-strip-item" tabIndex={copy === 1 ? -1 : undefined} onMouseEnter={() => setCursorText('Ver')} onMouseLeave={() => setCursorText('')}>
                    <img src={product.image} alt={copy === 1 ? '' : product.name} loading="lazy" />
                    <span>{product.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="hm-section" id="destacados">
        <div className="hm-heading reveal">
          <div>
            <p className="zc-eyebrow"><span className="zc-rule" aria-hidden="true" />Selección ZÉNIT</p>
            <h2>Best <em>sellers</em></h2>
          </div>
          <Link href="/productos" className="hm-more" onMouseEnter={() => setCursorText('Ver todo')} onMouseLeave={() => setCursorText('')}>Ver todo el catálogo <FineArrow /></Link>
        </div>
        <div className="zc-grid hm-grid">
          {featured.map((product, index) => <CatalogCard key={product.id} product={product} index={index} settings={settings} active={activeId === product.id} onOpen={() => openPiece(product.id)} onAdd={() => addToCart(product)} />)}
        </div>
      </section>

      {/* Cierre de contacto: destino del enlace "Contacto" del menú */}
      <section className="hx-contact" id="contacto">
        <div className="hx-contact-orbit" aria-hidden="true"><span /><span /></div>
        <div className="hx-contact-content reveal">
          <p className="hx-eyebrow"><span aria-hidden="true" />Atención directa</p>
          <h2>¿Buscas algo <em>especial?</em></h2>
          <p>Te ayudamos a elegir la pieza ideal, para ti o para regalar.</p>
          <a href={contactLink} className="hx-primary" target="_blank" rel="noreferrer">Escríbenos por WhatsApp <ArrowUpRight size={15} strokeWidth={1.4} /></a>
        </div>
      </section>
    </main>
    </ViewTransition>
  )
}
