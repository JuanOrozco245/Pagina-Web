'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { initialProducts, isSoldOut, type Product } from '@/lib/catalog'
import { finalPrice, totalPercent, whatsappLink } from '@/lib/settings'
import { useCart } from '@/components/cart-provider'

const fetchCatalog = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Local catalog is available only on localhost.')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

function FineArrow() { return <ArrowRight aria-hidden="true" size={16} strokeWidth={1.4} /> }

export default function Home() {
  const { data: products = initialProducts } = useSWR('/api/catalog', fetchCatalog, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { settings, addToCart } = useCart()
  const [cursorText, setCursorText] = useState('')
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  // Cursor dorado personalizado: solo con mouse. La aparición de los elementos (.reveal)
  // ahora es 100 % CSS, así que nunca depende de este efecto (antes, en celulares,
  // este efecto terminaba antes de activarla y el inicio quedaba casi vacío).
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const move = (event: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const magnetic = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    target.style.setProperty('--mx', `${(event.clientX - rect.left - rect.width / 2) * 0.12}px`)
    target.style.setProperty('--my', `${(event.clientY - rect.top - rect.height / 2) * 0.12}px`)
  }
  const resetMagnetic = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--mx', '0px'); event.currentTarget.style.setProperty('--my', '0px')
  }
  const tilt = (event: React.MouseEvent<HTMLElement>) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    el.style.setProperty('--rx', `${(0.5 - y) * 5}deg`)
    el.style.setProperty('--ry', `${(x - 0.5) * 5}deg`)
    el.style.setProperty('--shine-x', `${x * 100}%`)
    el.style.setProperty('--shine-y', `${y * 100}%`)
  }

  // Los bestsellers son los primeros productos del catálogo. El orden se cambia en /admin.
  const featured = products.slice(0, 4)
  const unique = products.filter((product, index, all) => all.findIndex((other) => other.image === product.image) === index)
  const [tileFeature, tilePhoto, tileWa] = [unique[0] ?? products[0], unique[1] ?? products[1] ?? products[0], unique[2] ?? products[2] ?? products[0]]
  const heroCategories = Array.from(new Set(products.map((product) => product.category))).slice(0, 4)
  // Miniaturas para invitar al catálogo: los siguientes productos (o los primeros si hay pocos).
  const teaser = (products.length > 8 ? products.slice(4, 9) : products.slice(0, 5))

  return (
    <main className="home-page">
      <div className="cursor-dot" ref={cursorRef} aria-hidden="true" />
      <div className={`cursor-ring ${cursorText ? 'cursor-ring-active' : ''}`} ref={ringRef} aria-hidden="true">{cursorText}</div>

      <div className="bento">
      <section className="hero2">
        <div className="hero2-orbit" aria-hidden="true" />
        <div className="hero2-visual" role="img" aria-label="Anillo dorado con diamante" />
        <i className="hero2-spark s1" aria-hidden="true" /><i className="hero2-spark s2" aria-hidden="true" /><i className="hero2-spark s3" aria-hidden="true" />
        <div className="hero2-content">
          <span className="hero2-eyebrow"><i aria-hidden="true" />Venta de joyería en oro</span>
          <h1>Detalles que <em>brillan contigo.</em></h1>
          <p className="hero2-lede">Joyas en oro para regalar, para celebrar y para ti.</p>
          <div className="hero-actions">
            <Link href="/productos" className="hero-cta" onMouseMove={magnetic} onMouseLeave={resetMagnetic} onMouseEnter={() => setCursorText('Ver')}>Ver catálogo <FineArrow /></Link>
            <a href={whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)} className="hero-wa" target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} strokeWidth={1.4} /></a>
          </div>
        </div>
      </section>
      {tileFeature && (
        <Link href={`/productos/${tileFeature.id}`} className="bento-tile bento-feature" onMouseEnter={() => setCursorText('Ver')} onMouseLeave={() => setCursorText('')}>
          <img src={tileFeature.image} alt="" className="bento-feature-img" />
          <span className="bento-label">Pieza destacada</span>
          <h3>{tileFeature.name}</h3>
          <p>{tileFeature.description}</p>
          <span className="bento-link">Ver pieza <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></span>
        </Link>
      )}

      <Link href="/productos" className="bento-tile bento-catalog" onMouseEnter={() => setCursorText('Ver')} onMouseLeave={() => setCursorText('')}>
        <span className="bento-thumbs" aria-hidden="true">{unique.slice(0, 4).map((product) => <img key={product.id} src={product.image} alt="" />)}</span>
        <h3>Todo el catálogo</h3>
        <p>{products.length} diseños en oro, listos para regalar.</p>
        <span className="bento-link">Ver catálogo <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></span>
      </Link>

      {tilePhoto && (
        <Link href={`/productos/${tilePhoto.id}`} className="bento-tile bento-photo" onMouseEnter={() => setCursorText('Ver')} onMouseLeave={() => setCursorText('')}>
          {/* Para usar un video propio: guárdalo como public/videos/joyas.mp4. Mientras no exista, se ve la foto. */}
          <video className="bento-video" poster={tilePhoto.image} autoPlay muted loop playsInline preload="metadata" aria-label={tilePhoto.name}><source src="/videos/joyas.mp4" type="video/mp4" /></video>
          <span className="bento-badge">{tilePhoto.category}</span>
          <span className="bento-photo-text"><strong>{tilePhoto.name}</strong><small>{tilePhoto.price === null ? 'Consultar' : money(finalPrice(tilePhoto, settings) ?? tilePhoto.price)}</small></span>
        </Link>
      )}

      <a href={whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)} className="bento-tile bento-wa" target="_blank" rel="noreferrer">
        {tileWa && <img src={tileWa.image} alt="" />}
        <span className="bento-label">Atención directa</span>
        <h3>¿Buscas algo <em>especial?</em></h3>
        <span className="bento-link">Escríbenos por WhatsApp <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" /></span>
      </a>
      </div>

      <section className="collection section-pad" id="destacados">
        <div className="collection-heading reveal">
          <h2>Best <em>sellers</em></h2>
          <Link href="/productos" className="underlined-link" onMouseEnter={() => setCursorText('Ver todo')} onMouseLeave={() => setCursorText('')}>Ver todo <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
        </div>
        <div className="product-grid featured-grid">
          {featured.map((product, index) => <article className="product-card reveal" key={product.id} onMouseMove={tilt} onMouseLeave={(event) => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg'); setCursorText('') }} onMouseEnter={() => setCursorText('Ver')}>
            <Link href={`/productos/${product.id}`} className="product-image-wrap"><img src={product.image} alt={`${product.name}, joyería Zenit`} className="product-image" /><span className="product-index">{String(index + 1).padStart(2, '0')}</span>{isSoldOut(product) && <span className="stock-badge">Agotado</span>}</Link>
            <div className="product-meta"><span>{product.category}</span><span>{product.price === null ? 'Consultar' : <>{totalPercent(product, settings) > 0 && <del>{money(product.price)}</del>} {money(finalPrice(product, settings) ?? product.price)}</>}</span></div>
            {totalPercent(product, settings) > 0 && <span className="product-sale">−{totalPercent(product, settings)}%</span>}
            <h3><Link href={`/productos/${product.id}`}>{product.name}</Link></h3>
            {product.price === null ? <a className="add-link" href={whatsappLink(`Hola, quiero consultar disponibilidad y precio de ${product.name}.`, settings)} target="_blank" rel="noreferrer">Consultar <ArrowUpRight size={14} strokeWidth={1.4} /></a> : isSoldOut(product) ? <span className="sold-out">Sin stock por ahora</span> : <button type="button" className="add-link" onClick={() => addToCart(product)} onMouseMove={magnetic} onMouseLeave={resetMagnetic}>Añadir <FineArrow /></button>}
          </article>)}
        </div>
      </section>

      <section className="contact-section" id="contacto">
        <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="contact-content reveal"><h2>¿Buscas algo <em>especial?</em></h2><a href={whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)} className="contact-cta" target="_blank" rel="noreferrer" onMouseMove={magnetic} onMouseLeave={resetMagnetic}>Escríbenos por WhatsApp <ArrowUpRight size={15} strokeWidth={1.4} /></a></div>
      </section>
    </main>
  )
}
