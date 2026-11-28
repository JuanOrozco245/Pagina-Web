'use client'

import { useEffect, useRef, useState, ViewTransition, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { isSoldOut, type Product } from '@/lib/catalog'
import { finalPrice, totalPercent, whatsappLink, type Settings } from '@/lib/settings'
import { pieceTransitionName } from '@/lib/transitions'

const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

/** Marca el elemento como visible la primera vez que entra en pantalla, para animar su aparición. */
export function useReveal<T extends HTMLElement>(initial = false) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(initial)
  useEffect(() => {
    const element = ref.current
    if (shown) return
    if (!element || typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); observer.disconnect() }
    // threshold 0: las piezas grandes son más altas que la pantalla y nunca llegarían a un porcentaje mayor.
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, shown] as const
}

type CatalogCardProps = {
  product: Product
  index: number
  settings: Settings
  /** true: la foto lleva el nombre compartido y viaja a la ficha al abrirla. */
  active?: boolean
  /** true: la tarjeta aparece ya visible, sin animación de entrada (por ejemplo, al volver de una ficha). */
  instant?: boolean
  onOpen?: () => void
  onAdd: () => void
}

/** Tarjeta de pieza del catálogo. Se usa en /productos y en los best sellers del inicio. */
export function CatalogCard({ product, index, settings, active = false, instant: instantProp = false, onOpen, onAdd }: CatalogCardProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [instant] = useState(instantProp)
  const [cardRef, shown] = useReveal<HTMLElement>(instant)
  const [loaded, setLoaded] = useState(instant)
  // Si la foto ya estaba en caché, onLoad puede dispararse antes de hidratar.
  useEffect(() => { if (imageRef.current?.complete) setLoaded(true) }, [])

  const price = finalPrice(product, settings)
  const percent = totalPercent(product, settings)
  const soldOut = isSoldOut(product)
  const href = `/productos/${product.id}`

  return (
    <article ref={cardRef} className={`zc-card ${instant ? 'is-instant' : shown ? 'is-in' : ''} ${loaded ? 'is-loaded' : ''}`} style={{ '--i': index % 5 } as CSSProperties}>
      <Link href={href} transitionTypes={['nav-forward']} onClick={onOpen} className="zc-media" aria-label={`Ver ${product.name}`}>
        {/* Mismo nombre que la foto de la ficha: el navegador la "vuela" de la tarjeta a la ficha. */}
        <ViewTransition name={active ? pieceTransitionName(product.id) : undefined} share="pieza" default="none">
          <img ref={imageRef} src={product.image} alt={product.name} loading={index < 10 ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} />
        </ViewTransition>
        <span className="zc-frame" aria-hidden="true" />
        <span className="zc-badges">
          {soldOut && <span className="zc-badge is-muted">Agotado</span>}
          {!soldOut && percent > 0 && price !== null && <span className="zc-badge">−{percent}%</span>}
        </span>
        <span className="zc-view" aria-hidden="true">Ver pieza <ArrowUpRight size={14} strokeWidth={1.4} /></span>
      </Link>
      <div className="zc-info">
        <h3><Link href={href} transitionTypes={['nav-forward']} onClick={onOpen}>{product.name}</Link></h3>
        <span className="zc-num">{product.category}</span>
        <div className="zc-row">
          <span className="zc-price">
            {price === null ? 'Precio a consultar' : <>{percent > 0 && product.price !== null && <del>{money(product.price)}</del>}{money(price)}</>}
          </span>
          {price === null
            ? <a className="zc-action" href={whatsappLink(`Hola, quiero consultar disponibilidad y precio de ${product.name}.`, settings)} target="_blank" rel="noreferrer">Consultar <ArrowUpRight size={14} strokeWidth={1.4} aria-hidden="true" /></a>
            : soldOut
              ? <span className="zc-action is-disabled">Sin stock</span>
              : <button type="button" className="zc-action" onClick={onAdd}>Añadir</button>}
        </div>
      </div>
    </article>
  )
}
