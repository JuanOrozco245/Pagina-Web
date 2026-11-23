'use client'

import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'
import { initialProducts, type Product } from '@/lib/catalog'
import { initialSettings, type Settings } from '@/lib/settings'

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

export default function ConfiguracionPage() {
  const { data: settings = initialSettings, error } = useSWR<Settings>('/api/settings', fetcher, { fallbackData: initialSettings, revalidateOnFocus: true })
  const { data: products = initialProducts } = useSWR<Product[]>('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { mutate: mutateGlobal } = useSWRConfig()
  const [draft, setDraft] = useState<Settings>(initialSettings)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(settings) }, [settings])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const response = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar.')
      await mutateGlobal('/api/settings')
      setNotice('Configuración guardada. La tienda ya usa estos datos.')
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeatured = (id: string) => setDraft((current) => ({
    ...current,
    featuredIds: current.featuredIds.includes(id) ? current.featuredIds.filter((item) => item !== id) : [...current.featuredIds, id].slice(0, 4),
  }))

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">GESTIÓN LOCAL · SOLO EN ESTE EQUIPO</p><h1>Ajustes de la <em>tienda.</em></h1><p className="admin-lede">Cambia el WhatsApp, el texto del inicio, el descuento general y qué productos aparecen en Bestsellers.</p></div><Link href="/" className="admin-back">Ver tienda →</Link></div>
        {error && <p className="admin-notice" role="status">Abre el proyecto desde localhost para guardar la configuración.</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        <form onSubmit={save} className="settings-form">
          <section className="settings-card"><h2>Contacto</h2><label>Número de WhatsApp<input value={draft.whatsapp} onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value.replace(/[^\d]/g, '') })} placeholder="Ej. 3001234567" maxLength={15} /><small>Solo números, sin espacios ni +. Si lo dejas vacío, los botones abren el selector de contacto.</small></label></section>
          <section className="settings-card"><h2>Inicio</h2><label>Título, primera línea<input value={draft.heroTitleTop} onChange={(event) => setDraft({ ...draft, heroTitleTop: event.target.value })} maxLength={60} /></label><label>Título en dorado<input value={draft.heroTitleAccent} onChange={(event) => setDraft({ ...draft, heroTitleAccent: event.target.value })} maxLength={60} /></label><label>Texto debajo del título<textarea rows={3} value={draft.heroCopy} onChange={(event) => setDraft({ ...draft, heroCopy: event.target.value })} maxLength={300} /></label><label>Imagen del inicio<input value={draft.heroImage} onChange={(event) => setDraft({ ...draft, heroImage: event.target.value })} placeholder="/images/atelier-hero.png" /><small>Ruta de una imagen dentro de public/images o una URL https.</small></label></section>
          <section className="settings-card"><h2>Promociones</h2><label>Descuento general (%)<input type="number" min="0" max="90" step="1" value={draft.globalDiscountPercent} onChange={(event) => setDraft({ ...draft, globalDiscountPercent: Number(event.target.value) })} /><small>Se suma al descuento individual de cada producto (máximo 90%).</small></label></section>
          <section className="settings-card settings-wide"><h2>Bestsellers del inicio</h2><p className="admin-lede">Marca hasta 4 productos. Aparecerán en una sola fila en la página principal; el resto vive en el catálogo completo.</p><div className="featured-grid">{products.map((product) => <label key={product.id} className="featured-option"><input type="checkbox" checked={draft.featuredIds.includes(product.id)} onChange={() => toggleFeatured(product.id)} disabled={!draft.featuredIds.includes(product.id) && draft.featuredIds.length >= 4} /><img src={product.image} alt="" /><span>{product.name}</span></label>)}</div></section>
          <div className="settings-actions"><button type="submit" className="admin-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar configuración'}</button></div>
        </form>
      </section>
    </main>
  )
}
