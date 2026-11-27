'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react'
import { initialProducts, isSoldOut, type Product } from '@/lib/catalog'
import { finalPrice, totalPercent, whatsappLink, type Settings } from '@/lib/settings'
import { useCart } from '@/components/cart-provider'

const fetchCatalog = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Local catalog is available only on localhost.')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

function FineArrow() { return <ArrowRight aria-hidden="true" size={16} strokeWidth={1.4} /> }

function CatalogPhotos({ photos, settings, onCursor }: { photos: Product[]; settings: Settings; onCursor: (text: string) => void }) {
  const [activeImage, setActiveImage] = useState<string>()
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const available = photos.filter((product) => !failedImages.has(product.image))
  const index = Math.max(0, available.findIndex((product) => product.image === activeImage))
  const photo = available[index]
  const nextImage = available.length > 1 ? available[(index + 1) % available.length].image : undefined
  const autoplay = !paused && !reducedMotion && !hovered && !focused

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!autoplay || !nextImage) return
    const timer = window.setTimeout(() => setActiveImage(nextImage), 5000)
    return () => window.clearTimeout(timer)
  }, [autoplay, nextImage])

  return (
    <div className="bento-tile bento-photo" role="group" aria-label="Fotos del catálogo"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
      {photo ? (
        <>
          {nextImage && (
            <div className="bento-photo-controls">
              {!reducedMotion && <button type="button" aria-label={paused ? 'Reanudar rotación de fotos' : 'Pausar rotación de fotos'} onClick={() => setPaused(!paused)}>{paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}</button>}
              <button type="button" aria-label="Siguiente foto" onClick={() => setActiveImage(nextImage)}><FineArrow /></button>
            </div>
          )}
          <Link href={`/productos/${photo.id}`} className="bento-photo-link" onMouseEnter={() => onCursor('Ver')} onMouseLeave={() => onCursor('')}>
            <img key={photo.image} className="bento-photo-img" src={photo.image} alt="" onError={() => setFailedImages((previous) => new Set(previous).add(photo.image))} />
            <span className="bento-badge">{photo.category}</span>
            <span className="bento-photo-text" aria-live={autoplay ? 'off' : 'polite'} aria-atomic="true">
              <strong>{photo.name}</strong>
              <small>{photo.price === null ? 'Consultar' : money(finalPrice(photo, settings) ?? photo.price)}</small>
            </span>
          </Link>
        </>
      ) : <Link href="/productos" className="bento-photo-link"><span className="bento-photo-text"><strong>Ver catálogo</strong></span></Link>}
    </div>
  )
}

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
  const unique = products.filter((product, index, all) => product.image && all.findIndex((other) => other.image === product.image) === index)
  const tileFeature = products.find((product) => product.id === settings.featuredProductId)
  const photos = products === initialProducts ? unique : [...unique].reverse()

  return (
    <main className="home-page">
      <div className="cursor-dot" ref={cursorRef} aria-hidden="true" />
      <div className={`cursor-ring ${cursorText ? 'cursor-ring-active' : ''}`} ref={ringRef} aria-hidden="true">{cursorText}</div>

      <div className={tileFeature ? 'bento' : 'bento bento-without-feature'}>
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

      {photos.length > 0 ? <CatalogPhotos photos={photos} settings={settings} onCursor={setCursorText} /> : <div className="bento-tile bento-photo"><p>No hay fotos del catálogo por ahora.</p></div>}

      <a href={whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)} className="bento-tile bento-wa" target="_blank" rel="noreferrer">
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
