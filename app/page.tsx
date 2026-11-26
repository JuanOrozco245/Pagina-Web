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

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const move = (event: MouseEvent) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
    }
    window.addEventListener('mousemove', move)
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.14 })
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => { window.removeEventListener('mousemove', move); observer.disconnect() }
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
  const heroProduct = featured[0]

  return (
    <main className="home-page">
      <div className="cursor-dot" ref={cursorRef} aria-hidden="true" />
      <div className={`cursor-ring ${cursorText ? 'cursor-ring-active' : ''}`} ref={ringRef} aria-hidden="true">{cursorText}</div>

      <section className="hero home-hero">
        <div className="hero-image" role="img" aria-label="Joyería dorada sobre una superficie oscura" style={{ backgroundImage: "url('/images/atelier-hero.png')" }} />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow reveal"><span className="eyebrow-line" />ZÉNIT JOYERÍA</p>
          <h1 className="reveal">Detalles que<br /><em>brillan contigo.</em></h1>
          <p className="hero-copy reveal">Topos y aretas doradas para regalar, combinar y hacer tuyos.</p>
          <div className="hero-actions reveal">
            <Link href="/productos" className="hero-cta" onMouseMove={magnetic} onMouseLeave={resetMagnetic} onMouseEnter={() => setCursorText('Ver')}>Ver catálogo <FineArrow /></Link>
            <a href={whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)} className="hero-wa" target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} strokeWidth={1.4} /></a>
          </div>
        </div>
        {heroProduct && (
          <Link href={`/productos/${heroProduct.id}`} className="hero-product reveal" onMouseEnter={() => setCursorText('Ver')} onMouseLeave={() => setCursorText('')}>
            <img src={heroProduct.image} alt={heroProduct.name} />
            <span><small>Bestseller</small><strong>{heroProduct.name}</strong></span>
          </Link>
        )}
      </section>

      <section className="collection section-pad" id="destacados">
        <div className="collection-heading reveal">
          <div><p className="eyebrow">BEST SELLERS</p><h2>Los más <em>pedidos.</em></h2></div>
          <Link href="/productos" className="underlined-link" onMouseEnter={() => setCursorText('Ver todo')} onMouseLeave={() => setCursorText('')}>Ver catálogo completo <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
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

      <section className="catalog-invite">
        <div>
          <p className="eyebrow">CATÁLOGO COMPLETO</p>
          <h2>{products.length} diseños <em>para elegir.</em></h2>
        </div>
        <Link href="/productos" className="catalog-invite-cta" onMouseMove={magnetic} onMouseLeave={resetMagnetic}>Ir al catálogo <ArrowRight size={15} strokeWidth={1.4} /></Link>
      </section>

      <section className="contact-section" id="contacto">
        <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="contact-content reveal"><p className="eyebrow">CONTACTO</p><h2>¿Buscas algo<br /><em>especial?</em></h2><p>Escríbenos para confirmar disponibilidad, resolver tus dudas y coordinar tu compra.</p><a href={whatsappLink('Hola, quiero conocer el catálogo de ZENIT Joyería', settings)} className="contact-cta" target="_blank" rel="noreferrer" onMouseMove={magnetic} onMouseLeave={resetMagnetic}>Preguntar por WhatsApp <ArrowUpRight size={15} strokeWidth={1.4} /></a></div>
      </section>
    </main>
  )
}
