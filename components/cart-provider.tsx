'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { isAdminPath } from '@/lib/admin-routes'
import { initialProducts, type Product } from '@/lib/catalog'
import { finalPrice, initialSettings, whatsappLink, type Settings } from '@/lib/settings'

type CartLine = { product: Product; quantity: number }
type CartContextValue = {
  cart: CartLine[]
  count: number
  subtotal: number
  settings: Settings
  addToCart: (product: Product) => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart debe usarse dentro de CartProvider')
  return value
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: products = initialProducts } = useSWR<Product[]>('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { data: settings = initialSettings } = useSWR<Settings>('/api/settings', fetcher, { fallbackData: initialSettings, revalidateOnFocus: true })
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const bagButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!cartOpen) return
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setCartOpen(false) }
    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown); bagButtonRef.current?.focus() }
  }, [cartOpen])

  const addToCart = (product: Product) => {
    if (product.price === null || (product.stock !== null && product.stock !== undefined && product.stock <= 0)) return
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id)
      return existing
        ? items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { product, quantity: 1 }]
    })
    setSent(false)
    setNotice('')
    setCartOpen(true)
  }

  const changeQuantity = (id: string, change: number) => setCart((items) => items.map((item) => item.product.id === id ? { ...item, quantity: item.quantity + change } : item).filter((item) => item.quantity > 0))

  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (finalPrice(item.product, settings) ?? 0) * item.quantity, 0)

  const submitOrder = async () => {
    if (!nombre.trim() || cart.length === 0) {
      setNotice('Escribe tu nombre para enviar la solicitud.')
      return
    }
    setSending(true)
    setNotice('')
    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          nombre: nombre.trim(),
          whatsapp: telefono.replace(/[^\d]/g, ''),
          items: cart.map(({ product, quantity }) => ({ productId: product.id, name: product.name, quantity, price: finalPrice(product, settings) ?? 0, cost: product.cost ?? 0 })),
          subtotal,
          estado: 'pendiente',
        }),
      })
      if (!response.ok) throw new Error('No se pudo guardar la solicitud.')
      setSent(true)
      setCart([])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo guardar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  const value = useMemo<CartContextValue>(() => ({ cart, count, subtotal, settings, addToCart, openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false) }), [cart, count, subtotal, settings])

  const whatsappText = cart.length
    ? `Hola, quisiera consultar sobre: ${cart.map((i) => `${i.quantity} × ${i.product.name}`).join(', ')}. Subtotal ${money(subtotal)}.`
    : 'Hola, quiero conocer el catálogo de ZENIT Joyería'

  return (
    <CartContext.Provider value={value}>
      {children}
      {!isAdminPath(pathname) && <button ref={bagButtonRef} className="floating-bag" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${count} artículos`}><ShoppingBag size={18} strokeWidth={1.4} /><span>{count}</span></button>}
      <div className={`drawer-backdrop ${cartOpen ? 'backdrop-visible' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true" />
      <aside className={`cart-drawer ${cartOpen ? 'drawer-open' : ''}`} role="dialog" aria-modal="true" aria-label="Tu bolsa" aria-hidden={!cartOpen} inert={!cartOpen}>
        <div className="drawer-header"><div><p className="eyebrow">ZENIT · TU SELECCIÓN</p><h2>Tu bolsa <span>({count})</span></h2></div><button ref={closeButtonRef} className="close-drawer" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X size={20} strokeWidth={1.3} /></button></div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {sent && <p className="admin-notice" role="status">Solicitud recibida — te contactaremos.</p>}
        {cart.length === 0 ? <div className="cart-empty"><span className="empty-ornament">✳</span><p>Tu historia comienza<br />con una pieza.</p><a className="underlined-link" href="/productos" onClick={() => setCartOpen(false)}>Descubrir la colección <ArrowUpRight size={14} /></a></div> : <>
          <div className="cart-lines">{cart.map(({ product, quantity }) => <div className="cart-line" key={product.id}><img src={product.image} alt="" /><div className="cart-line-info"><span>{product.category}</span><h3>{product.name}</h3><strong>{money(finalPrice(product, settings) ?? 0)}</strong><div className="quantity-control"><button aria-label={`Quitar una unidad de ${product.name}`} onClick={() => changeQuantity(product.id, -1)}><Minus size={12} /></button><span>{quantity}</span><button aria-label={`Añadir una unidad de ${product.name}`} onClick={() => changeQuantity(product.id, 1)}><Plus size={12} /></button></div></div><button className="remove-item" aria-label={`Eliminar ${product.name}`} onClick={() => setCart((items) => items.filter((item) => item.product.id !== product.id))}><X size={15} /></button></div>)}</div>
          <div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div className="cart-form"><label>Tu nombre<input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Nombre para contactarte" maxLength={100} /></label><label>Tu WhatsApp (opcional)<input value={telefono} onChange={(event) => setTelefono(event.target.value)} placeholder="3001234567" inputMode="tel" maxLength={15} /></label><button className="request-button" onClick={submitOrder} disabled={sending}>{sending ? 'Enviando…' : 'Enviar solicitud'}</button></div>
            <a className="whatsapp-link" href={whatsappLink(whatsappText, settings)} target="_blank" rel="noreferrer">Continuar por WhatsApp <ArrowUpRight size={14} /></a>
          </div>
        </>}
        <div className="drawer-foot">ZENIT JOYERÍA · DISEÑOS DORADOS</div>
      </aside>
    </CartContext.Provider>
  )
}
