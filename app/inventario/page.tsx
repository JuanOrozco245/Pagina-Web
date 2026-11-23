'use client'

import { useRef, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'
import { CATEGORIES, initialProducts, isCategory, type Product } from '@/lib/catalog'

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

const HEADERS = ['id', 'categoria', 'nombre', 'descripcion', 'precio', 'descuento', 'costo', 'stock', 'imagen']
const EXAMPLE = ['ejemplo-id', 'Topos', 'Corazón ejemplo', 'Descripción del producto', '250000', '0', '120000', '10', '/images/zenit-heart.png']

function parseCSV(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split('\n')[0] || ''
  const delimiter = (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') { field += '"'; i++ }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === delimiter) { row.push(field); field = '' }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (char !== '\r') field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter((item) => item.some((cell) => cell.trim() !== ''))
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const numberOrNull = (value: string) => {
  const clean = value.replace(/[^\d.-]/g, '')
  return clean === '' || !Number.isFinite(Number(clean)) ? null : Number(clean)
}

function rowsToProducts(rows: string[][]): Product[] {
  if (rows.length < 2) return []
  const header = rows[0].map(normalize)
  const index = (names: string[]) => {
    for (const name of names) {
      const found = header.indexOf(name)
      if (found >= 0) return found
    }
    return -1
  }
  const columns = {
    id: index(['id']),
    category: index(['categoria', 'category']),
    name: index(['nombre', 'name']),
    description: index(['descripcion', 'description']),
    price: index(['precio', 'price']),
    discount: index(['descuento', 'descuento%', 'discount']),
    cost: index(['costo', 'cost']),
    stock: index(['stock', 'inventario', 'inventory']),
    image: index(['imagen', 'image']),
  }
  const get = (row: string[], position: number) => position >= 0 ? (row[position] || '').trim() : ''
  return rows.slice(1).map((row) => {
    const name = get(row, columns.name)
    return {
      id: get(row, columns.id) || slug(name),
      category: get(row, columns.category),
      name,
      description: get(row, columns.description),
      price: numberOrNull(get(row, columns.price)),
      discountPercent: numberOrNull(get(row, columns.discount)) ?? 0,
      cost: numberOrNull(get(row, columns.cost)),
      stock: numberOrNull(get(row, columns.stock)),
      image: get(row, columns.image) || '/images/zenit-heart.png',
    } as Product
  })
}

export default function InventarioPage() {
  const { data: products = initialProducts } = useSWR('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true })
  const { mutate: mutateGlobal } = useSWRConfig()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'replace' | 'merge'>('merge')
  const [preview, setPreview] = useState<Product[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const download = (withData: boolean) => {
    const lines = [HEADERS.join(';')]
    if (withData) {
      products.forEach((product) => lines.push([
        product.id, product.category, product.name, product.description,
        product.price ?? '', product.discountPercent, product.cost ?? '', product.stock ?? '', product.image,
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')))
    } else {
      lines.push(EXAMPLE.map((value) => `"${value}"`).join(';'))
    }
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = withData ? `zenit-inventario-${new Date().toISOString().slice(0, 10)}.csv` : 'zenit-plantilla.csv'
    link.click()
    URL.revokeObjectURL(url)
    setNotice(withData ? 'Inventario descargado. Ábrelo con Excel.' : 'Plantilla descargada.')
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return
    setNotice('')
    const parsed = rowsToProducts(parseCSV(await file.text()))
    const found: string[] = []
    if (parsed.length === 0) found.push('El archivo no tiene productos. Revisa que la primera fila sea los encabezados.')
    parsed.forEach((product, index) => {
      if (!product.name || !product.category) found.push(`Fila ${index + 2}: falta nombre o categoría.`)
      else if (!isCategory(product.category)) found.push(`Fila ${index + 2}: la categoría debe ser una de ${CATEGORIES.join(', ')}.`)
      if (product.price !== null && (product.price <= 0 || product.price > 100000000)) found.push(`Fila ${index + 2}: precio no válido.`)
      if (typeof product.cost === 'number' && (product.cost < 0 || product.cost > 100000000)) found.push(`Fila ${index + 2}: costo no válido.`)
      if (product.discountPercent < 0 || product.discountPercent > 90) found.push(`Fila ${index + 2}: descuento debe estar entre 0 y 90.`)
      if (typeof product.stock === 'number' && product.stock < 0) found.push(`Fila ${index + 2}: stock no válido.`)
    })
    const ids = parsed.map((product) => product.id)
    if (new Set(ids).size !== ids.length) found.push('Hay identificadores repetidos. Revisa la columna id.')
    setErrors(found)
    setPreview(parsed)
    setNotice(found.length ? 'Revisa los errores antes de aplicar.' : `${parsed.length} productos listos para aplicar.`)
  }

  const apply = async () => {
    const finalProducts = mode === 'replace'
      ? preview
      : [...products.map((product) => preview.find((item) => item.id === product.id) || product), ...preview.filter((item) => !products.some((product) => product.id === item.id))]
    setSaving(true)
    setNotice('')
    try {
      const response = await fetch('/api/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProducts) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo aplicar el inventario.')
      await mutateGlobal('/api/catalog', finalProducts, { revalidate: false })
      setNotice(`${finalProducts.length} productos guardados correctamente.`)
      setPreview([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo aplicar el inventario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">GESTIÓN LOCAL · SOLO EN ESTE EQUIPO</p><h1>Inventario <em>masivo.</em></h1><p className="admin-lede">Descarga tu inventario en Excel, edítalo y súbelo de vuelta para actualizar precios, costos y stock de muchos productos a la vez.</p></div><Link href="/admin" className="admin-back">Ir al panel →</Link></div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        <div className="backup-grid">
          <article className="backup-card"><h2>1. Descargar</h2><p>Se crea un archivo CSV que abre Excel. Ahí puedes editar todas las filas.</p><button className="admin-primary" onClick={() => download(true)}>Descargar inventario</button><button className="admin-secondary bulk-secondary" onClick={() => download(false)}>Descargar plantilla vacía</button></article>
          <article className="backup-card"><h2>2. Subir el archivo</h2><p>Selecciona el CSV ya editado. Revisa la vista previa y aplica los cambios.</p><label className="admin-upload-button">Elegir archivo CSV<input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(event) => readFile(event.target.files?.[0])} /></label></article>
        </div>
        <section className="bulk-help"><h2>Columnas del archivo</h2><p><code>id;categoria;nombre;descripcion;precio;descuento;costo;stock;imagen</code></p><p>Puedes dejar <code>id</code> vacío: se crea automáticamente desde el nombre. Deja <code>precio</code>, <code>costo</code> o <code>stock</code> vacíos si no aplican. Usa punto y coma para separar columnas. Las únicas categorías válidas son <code>{CATEGORIES.join(', ')}</code>.</p></section>
        {preview.length > 0 && <section className="bulk-preview">
          <div className="admin-toolbar"><div><h2>Vista previa</h2><p>{preview.length} productos del archivo.</p></div><div className="bulk-modes"><label><input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Actualizar y agregar</label><label><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Reemplazar todo</label></div></div>
          {errors.length > 0 && <div className="bulk-errors"><strong>Revisa estos puntos:</strong>{errors.slice(0, 12).map((error) => <p key={error}>{error}</p>)}{errors.length > 12 && <p>…y {errors.length - 12} más.</p>}</div>}
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Costo</th><th>Stock</th></tr></thead><tbody>{preview.slice(0, 25).map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.category}</td><td>{product.price ?? 'Consultar'}</td><td>{product.cost ?? '—'}</td><td>{product.stock ?? 'Ilimitado'}</td></tr>)}</tbody></table></div>
          {preview.length > 25 && <p className="admin-empty">Mostrando los primeros 25 productos.</p>}
          <div className="settings-actions"><button className="admin-secondary" onClick={() => setPreview([])}>Cancelar</button><button className="admin-primary" onClick={apply} disabled={saving || errors.length > 0}>{saving ? 'Aplicando…' : 'Aplicar al catálogo'}</button></div>
        </section>}
      </section>
    </main>
  )
}
