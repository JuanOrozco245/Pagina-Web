'use client'

import { useMemo, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AdminNav } from '@/components/admin-nav'
import { Wordmark } from '@/components/wordmark'
import { CATEGORIES, discountedPrice, initialProducts, type Product } from '@/lib/catalog'
import { finalPrice, initialSettings, margin, profit, type Settings } from '@/lib/settings'

const fetchSettings = async (url: string): Promise<Settings> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}
const money = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
const fetchCatalog = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('El panel se administra desde tu equipo, en localhost.')
  return response.json()
}
const emptyProduct = (): Product => ({ id: '', category: 'Topos', name: '', description: '', price: 0, discountPercent: 0, cost: null, image: '/images/zenit-heart.png', stock: null })

export function AdminCatalog() {
  const { data: products = initialProducts, error, mutate } = useSWR('/api/catalog', fetchCatalog, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { data: settings = initialSettings } = useSWR('/api/settings', fetchSettings, { fallbackData: initialSettings, revalidateOnFocus: true })
  const { mutate: mutateGlobal } = useSWRConfig()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Product | null>(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const activeDiscounts = products.filter((product) => product.discountPercent > 0).length
  const inventoryValue = products.reduce((sum, product) => sum + (finalPrice(product, settings) ?? 0), 0)
  const potentialProfit = products.reduce((sum, product) => sum + (profit(product, settings) ?? 0), 0)

  const persist = async (updated: Product[]) => {
    const response = await fetch('/api/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar.')
    await mutate(updated, { revalidate: false })
    await mutateGlobal('/api/catalog', updated, { revalidate: false })
  }

  const uploadImage = async (file: File | undefined) => {
    if (!file || !draft) return
    const formData = new FormData()
    formData.set('image', file)
    setUploading(true)
    try {
      const response = await fetch('/api/catalog/image', { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo subir la imagen.')
      setDraft({ ...draft, image: result.image })
      setNotice('Imagen guardada en public/images.')
    } catch (uploadError) {
      setNotice(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return
    const id = draft.id || draft.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!id) return setNotice('Escribe el nombre del producto.')
    const next: Product = {
      ...draft,
      id,
      name: draft.name.trim(),
      category: draft.category.trim(),
      price: draft.price === null || Number(draft.price) <= 0 ? null : Number(draft.price),
      discountPercent: Number(draft.discountPercent),
      stock: draft.stock === null || draft.stock === undefined ? null : Number(draft.stock),
    }
    const updated = draft.id ? products.map((product) => product.id === draft.id ? next : product) : [...products, next]
    setSaving(true)
    setNotice('')
    try {
      await persist(updated)
      setDraft(null)
      setNotice('Cambios guardados en data/catalog.json')
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (product: Product) => {
    if (!window.confirm(`¿Eliminar “${product.name}” del catálogo?`)) return
    try {
      await persist(products.filter((item) => item.id !== product.id))
      setNotice('Producto eliminado del catálogo local.')
    } catch (removeError) {
      setNotice(removeError instanceof Error ? removeError.message : 'No se pudo eliminar el producto.')
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= products.length) return
    const updated = [...products]
    const [moved] = updated.splice(index, 1)
    updated.splice(target, 0, moved)
    try {
      await persist(updated)
      setNotice('Orden actualizado.')
    } catch (moveError) {
      setNotice(moveError instanceof Error ? moveError.message : 'No se pudo cambiar el orden.')
    }
  }

  return (
    <main className="admin-shell">
      <AdminNav />
      <header className="admin-header"><Wordmark /><Link href="/" className="admin-back"><ArrowLeft size={14} /> Volver a la tienda</Link></header>
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">PANEL DE CONTROL · SOLO EN ESTE EQUIPO</p><h1>Tu catálogo, <em>bajo control.</em></h1><p className="admin-lede">Agrega productos, actualiza precios, costos, descuentos y stock, o carga todo de una vez desde Excel.</p></div><div className="admin-head-actions"><Link href="/inventario" className="admin-secondary">Carga masiva</Link><button className="admin-primary" onClick={() => setDraft(emptyProduct())}><Plus size={15} /> Nuevo producto</button></div></div>
        <div className="admin-stats"><article><span>Productos</span><strong>{products.length}</strong><small>En tu catálogo local</small></article><article><span>Con descuento</span><strong>{activeDiscounts}</strong><small>Promociones activas</small></article><article><span>Valor de venta</span><strong>{money(inventoryValue)}</strong><small>Suma de precios finales</small></article><article><span>Utilidad potencial</span><strong className="finance-value">{money(potentialProfit)}</strong><small>Con los costos cargados</small></article></div>
        <div className="admin-toolbar"><div><h2>Productos</h2><p>Usa las flechas para cambiar el orden. Los primeros 4 aparecen como bestsellers en el inicio.</p></div><label className="admin-search"><Search size={15} /><span className="sr-only">Buscar productos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o categoría" /></label></div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {error && <p className="admin-notice" role="status">La tienda remota no guarda cambios locales. Abre el proyecto desde localhost para editar y guardar.</p>}
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Producto</th><th>Precio</th><th>Descuento</th><th>Precio final</th><th>Costo</th><th>Utilidad</th><th>Margen</th><th>Stock</th><th>Orden</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}>
          <td><div className="admin-product"><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>{product.category}</small><Link href={`/productos/${product.id}`} className="admin-view-link">Ver ficha <ArrowUpRight size={11} /></Link></div></div></td>
          <td>{product.price === null ? 'Consultar' : money(product.price)}</td>
          <td>{product.discountPercent ? <span className="admin-discount">−{product.discountPercent}%</span> : <span className="admin-muted">—</span>}</td>
          <td>{discountedPrice(product) === null ? 'Consultar' : money(finalPrice(product, settings) ?? 0)}</td>
          <td>{product.cost === null || product.cost === undefined ? <span className="admin-muted">—</span> : money(product.cost)}</td>
          <td className={profit(product, settings) === null ? 'admin-muted' : 'finance-value'}>{profit(product, settings) === null ? '—' : money(profit(product, settings)!)}</td>
          <td>{margin(product, settings) === null ? <span className="admin-muted">—</span> : `${margin(product, settings)}%`}</td>
          <td>{product.stock === null || product.stock === undefined ? <span className="admin-muted">Ilimitado</span> : product.stock}</td>
          <td><div className="admin-actions"><button aria-label={`Subir ${product.name}`} onClick={() => move(products.findIndex((item) => item.id === product.id), -1)}><ArrowUp size={14} /></button><button aria-label={`Bajar ${product.name}`} onClick={() => move(products.findIndex((item) => item.id === product.id), 1)}><ArrowDown size={14} /></button></div></td>
          <td><div className="admin-actions"><button aria-label={`Editar ${product.name}`} onClick={() => setDraft({ ...product })}><Pencil size={15} /></button><button aria-label={`Eliminar ${product.name}`} onClick={() => remove(product)}><Trash2 size={15} /></button></div></td>
        </tr>)}</tbody></table>{filtered.length === 0 && <p className="admin-empty">No hay productos que coincidan con la búsqueda.</p>}</div>
        <p className="admin-storage-note"><span /> Tus cambios se guardan en <code>data/catalog.json</code> en esta computadora. Haz una copia de seguridad desde <Link href="/respaldo">Respaldo</Link>.</p>
      </section>
      {draft && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title"><div className="admin-modal-heading"><div><p className="admin-eyebrow">CATÁLOGO ZENIT</p><h2 id="product-form-title">{draft.id ? 'Editar producto' : 'Nuevo producto'}</h2></div><button className="admin-modal-close" aria-label="Cerrar formulario" onClick={() => setDraft(null)}>×</button></div>{notice && <p className="admin-upload-status" role="status">{notice}</p>}<form onSubmit={save} className="admin-form">
        <label>Nombre<input required maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ej. Aretes dorados" /></label>
        <label>Categoría<select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>Descripción<textarea maxLength={500} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Material, detalles y estilo" /></label>
        <div className="admin-form-grid"><label>Precio en COP<input type="number" min="0" step="1000" value={draft.price ?? ''} onChange={(event) => setDraft({ ...draft, price: event.target.value === '' ? null : Number(event.target.value) })} placeholder="0 = consultar" /></label><label>Descuento (%)<input type="number" min="0" max="90" step="1" value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: Number(event.target.value) })} /></label><label>Costo en COP<input type="number" min="0" step="1000" value={draft.cost ?? ''} onChange={(event) => setDraft({ ...draft, cost: event.target.value === '' ? null : Number(event.target.value) })} placeholder="Para calcular utilidad" /></label></div>
        <div className="admin-form-grid"><label>Stock (unidades)<input type="number" min="0" step="1" value={draft.stock ?? ''} onChange={(event) => setDraft({ ...draft, stock: event.target.value === '' ? null : Number(event.target.value) })} placeholder="Vacío = ilimitado" /></label></div>
        <div className="admin-field"><label htmlFor="product-image-path">Imagen del producto</label><div className="admin-image-input"><ImagePlus size={15} /><input id="product-image-path" required value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="/images/zenit-heart.png" /></div><small>Ruta de la imagen o URL https.</small><label className="admin-upload-button">{uploading ? 'Subiendo…' : 'Subir imagen'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadImage(event.target.files?.[0])} disabled={uploading} /></label></div>
        <div className="admin-form-actions"><button type="button" className="admin-secondary" onClick={() => setDraft(null)}>Cancelar</button><button type="submit" className="admin-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar producto'}</button></div>
      </form></section></div>}
    </main>
  )
}
