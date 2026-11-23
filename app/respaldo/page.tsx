'use client'

import { useRef, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'
import { initialProducts, type Product } from '@/lib/catalog'

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

export default function RespaldoPage() {
  const { data: products = initialProducts } = useSWR('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { mutate: mutateGlobal } = useSWRConfig()
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const download = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zenit-catalogo-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Copia descargada. Guárdala en un lugar seguro.')
  }

  const restore = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setNotice('')
    try {
      const value = JSON.parse(await file.text())
      if (!Array.isArray(value)) throw new Error('El archivo no parece un catálogo válido.')
      const response = await fetch('/api/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo restaurar.')
      await mutateGlobal('/api/catalog', value, { revalidate: false })
      setNotice('Catálogo restaurado correctamente.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo restaurar.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">GESTIÓN LOCAL · SOLO EN ESTE EQUIPO</p><h1>Respaldo del <em>catálogo.</em></h1><p className="admin-lede">Descarga una copia de tus productos o restaura una copia anterior. No cierres esta página mientras se guarda.</p></div><Link href="/" className="admin-back">Ver tienda →</Link></div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        <div className="backup-grid">
          <article className="backup-card"><h2>Descargar copia</h2><p>Guarda el catálogo actual en un archivo JSON en tu computadora.</p><button className="admin-primary" onClick={download}>Descargar copia</button></article>
          <article className="backup-card"><h2>Restaurar copia</h2><p>Selecciona un archivo JSON guardado antes. Los productos actuales serán reemplazados.</p><label className="admin-upload-button">Elegir archivo<input ref={fileRef} type="file" accept="application/json,.json" onChange={(event) => restore(event.target.files?.[0])} disabled={busy} /></label></article>
        </div>
        <p className="admin-storage-note"><span /> Tus datos viven en <code>data/catalog.json</code> en este equipo. Haz una copia de seguridad de vez en cuando.</p>
      </section>
    </main>
  )
}
