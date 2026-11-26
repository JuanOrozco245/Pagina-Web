'use client'

import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'
import { initialSettings, type Settings } from '@/lib/settings'

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

export default function VentasPage() {
  const { data: settings = initialSettings, error } = useSWR<Settings>('/api/settings', fetcher, { fallbackData: initialSettings, revalidateOnFocus: true })
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
      setNotice('Datos de venta guardados.')
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row">
          <div>
            <p className="admin-eyebrow">VENTAS</p>
            <h1>Contacto y <em>descuento.</em></h1>
            <p className="admin-lede">Solo lo necesario para vender: el WhatsApp que reciben tus clientes y el descuento general del catálogo.</p>
          </div>
          <Link href="/productos" className="admin-back">Ver tienda →</Link>
        </div>
        {error && <p className="admin-notice" role="status">Abre el proyecto desde localhost para guardar los datos de venta.</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        <form onSubmit={save} className="settings-form settings-form-compact">
          <section className="settings-card">
            <h2>WhatsApp</h2>
            <label>Número de contacto
              <input value={draft.whatsapp} onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value.replace(/[^\d]/g, '') })} placeholder="Ej. 3001234567" maxLength={15} />
              <small>Solo números, sin espacios ni +. Es el número que se abre desde los botones de la tienda.</small>
            </label>
          </section>
          <section className="settings-card">
            <h2>Descuento general</h2>
            <label>Porcentaje (%)
              <input type="number" min="0" max="90" step="1" value={draft.globalDiscountPercent} onChange={(event) => setDraft({ ...draft, globalDiscountPercent: Number(event.target.value) })} />
              <small>Se suma al descuento individual de cada producto (máximo 90%).</small>
            </label>
          </section>
          <div className="settings-actions"><button type="submit" className="admin-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button></div>
        </form>
      </section>
    </main>
  )
}
