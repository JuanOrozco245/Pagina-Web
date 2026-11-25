import { randomUUID } from 'node:crypto'
import { appendFileSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Product } from '@/lib/catalog'
import type { Settings } from '@/lib/settings'

/**
 * Historial de cambios. Cada línea de data/historial.jsonl es un movimiento:
 * quién lo hizo, cuándo y qué cambió. Se escribe desde el servidor, así que
 * no depende de que el navegador "se acuerde" de avisar.
 */
export type Actor = { usuario: string; nombre: string }
export type TipoHistorial = 'producto' | 'ajustes' | 'pedido' | 'sesion' | 'usuario' | 'imagen'
export type Cambio = { campo: string; antes: string; despues: string }
export type HistorialEntry = {
  id: string
  fecha: string
  usuario: string
  nombre: string
  tipo: TipoHistorial
  accion: string
  resumen: string
  cambios?: Cambio[]
  detalle?: string[]
}

const historyPath = path.join(process.cwd(), 'data', 'historial.jsonl')
const MAX_BYTES = 3 * 1024 * 1024 // al pasar de 3 MB, el archivo se archiva y se empieza otro

export function registrar(actor: Actor, entry: Omit<HistorialEntry, 'id' | 'fecha' | 'usuario' | 'nombre'>) {
  try {
    mkdirSync(path.dirname(historyPath), { recursive: true })
    try {
      if (statSync(historyPath).size > MAX_BYTES) renameSync(historyPath, `${historyPath}.${new Date().toISOString().slice(0, 10)}.old`)
    } catch {
      // el archivo todavía no existe
    }
    const full: HistorialEntry = { id: randomUUID(), fecha: new Date().toISOString(), usuario: actor.usuario, nombre: actor.nombre, ...entry }
    appendFileSync(historyPath, `${JSON.stringify(full)}\n`, 'utf8')
  } catch (error) {
    // Un fallo al anotar el historial nunca debe impedir que el cambio se guarde.
    console.error('No se pudo escribir el historial:', error)
  }
}

export function leerHistorial(options: { limit?: number; usuario?: string; tipo?: string } = {}): HistorialEntry[] {
  let raw = ''
  try {
    raw = readFileSync(historyPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const entries: HistorialEntry[] = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      entries.push(JSON.parse(line) as HistorialEntry)
    } catch {
      // línea dañada: se ignora
    }
  }
  return entries
    .reverse()
    .filter((entry) => (!options.usuario || entry.usuario === options.usuario) && (!options.tipo || entry.tipo === options.tipo))
    .slice(0, Math.min(Math.max(options.limit ?? 100, 1), 500))
}

/* ---------- Formato legible de los valores ---------- */
const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

function texto(value: unknown, max = 70) {
  if (value === null || value === undefined || value === '') return '—'
  const s = String(value)
  return s.length > max ? `${s.slice(0, max)}…` : s
}

function formatearProducto(campo: keyof Product, value: unknown) {
  if (campo === 'price') return value === null || value === undefined ? 'Consultar' : cop.format(Number(value))
  if (campo === 'cost') return value === null || value === undefined ? '—' : cop.format(Number(value))
  if (campo === 'discountPercent') return `${Number(value ?? 0)}%`
  if (campo === 'stock') return value === null || value === undefined ? 'Ilimitado' : `${value} u.`
  return texto(value)
}

const CAMPOS_PRODUCTO: [keyof Product, string][] = [
  ['name', 'Nombre'],
  ['category', 'Categoría'],
  ['description', 'Descripción'],
  ['price', 'Precio'],
  ['discountPercent', 'Descuento'],
  ['cost', 'Costo'],
  ['stock', 'Stock'],
  ['image', 'Imagen'],
]

const mismo = (a: unknown, b: unknown) => (a ?? null) === (b ?? null)

function cambiosDeProducto(antes: Product, despues: Product): Cambio[] {
  const cambios: Cambio[] = []
  for (const [campo, etiqueta] of CAMPOS_PRODUCTO) {
    if (!mismo(antes[campo], despues[campo])) {
      cambios.push({ campo: etiqueta, antes: formatearProducto(campo, antes[campo]), despues: formatearProducto(campo, despues[campo]) })
    }
  }
  return cambios
}

/** Compara el catálogo anterior con el nuevo y anota cada producto agregado, modificado o eliminado. */
export function registrarCatalogo(actor: Actor, antes: Product[], despues: Product[]) {
  const antesPorId = new Map(antes.map((p) => [p.id, p]))
  const despuesPorId = new Map(despues.map((p) => [p.id, p]))

  const agregados = despues.filter((p) => !antesPorId.has(p.id))
  const eliminados = antes.filter((p) => !despuesPorId.has(p.id))
  const modificados: { producto: Product; cambios: Cambio[] }[] = []
  for (const producto of despues) {
    const previo = antesPorId.get(producto.id)
    if (!previo) continue
    const cambios = cambiosDeProducto(previo, producto)
    if (cambios.length) modificados.push({ producto, cambios })
  }
  const idsComunesAntes = antes.filter((p) => despuesPorId.has(p.id)).map((p) => p.id)
  const idsComunesDespues = despues.filter((p) => antesPorId.has(p.id)).map((p) => p.id)
  const reordenado = idsComunesAntes.join('|') !== idsComunesDespues.join('|')

  const total = agregados.length + eliminados.length + modificados.length

  // Cargas masivas (inventario, restaurar copia): una sola línea resumen con el detalle.
  if (total > 8) {
    const detalle = [
      ...agregados.map((p) => `Agregó: ${p.name}`),
      ...modificados.map(({ producto, cambios }) => `Modificó: ${producto.name} (${cambios.map((c) => c.campo.toLowerCase()).join(', ')})`),
      ...eliminados.map((p) => `Eliminó: ${p.name}`),
    ]
    const partes = [
      agregados.length ? `${agregados.length} agregado${agregados.length === 1 ? '' : 's'}` : '',
      modificados.length ? `${modificados.length} modificado${modificados.length === 1 ? '' : 's'}` : '',
      eliminados.length ? `${eliminados.length} eliminado${eliminados.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean)
    registrar(actor, {
      tipo: 'producto',
      accion: 'carga masiva',
      resumen: `Actualizó el catálogo de una vez: ${partes.join(', ')}.`,
      detalle: detalle.slice(0, 60).concat(detalle.length > 60 ? [`…y ${detalle.length - 60} más`] : []),
    })
    return
  }

  for (const p of agregados) {
    registrar(actor, {
      tipo: 'producto',
      accion: 'agregó',
      resumen: `Agregó el producto “${p.name}”.`,
      cambios: [
        { campo: 'Categoría', antes: '—', despues: texto(p.category) },
        { campo: 'Precio', antes: '—', despues: formatearProducto('price', p.price) },
      ],
    })
  }
  for (const { producto, cambios } of modificados) {
    registrar(actor, { tipo: 'producto', accion: 'modificó', resumen: `Modificó “${producto.name}”.`, cambios })
  }
  for (const p of eliminados) {
    registrar(actor, {
      tipo: 'producto',
      accion: 'eliminó',
      resumen: `Eliminó el producto “${p.name}”.`,
      cambios: [{ campo: 'Precio que tenía', antes: formatearProducto('price', p.price), despues: '—' }],
    })
  }
  if (reordenado) registrar(actor, { tipo: 'producto', accion: 'reordenó', resumen: 'Cambió el orden de los productos.' })
}

const CAMPOS_AJUSTES: [keyof Settings, string][] = [
  ['whatsapp', 'WhatsApp'],
  ['heroTitleTop', 'Título del inicio (línea 1)'],
  ['heroTitleAccent', 'Título del inicio (en dorado)'],
  ['heroCopy', 'Texto del inicio'],
  ['heroImage', 'Imagen del inicio'],
  ['globalDiscountPercent', 'Descuento general'],
  ['featuredIds', 'Productos Bestsellers'],
]

export function registrarAjustes(actor: Actor, antes: Settings, despues: Settings) {
  const cambios: Cambio[] = []
  for (const [campo, etiqueta] of CAMPOS_AJUSTES) {
    const a = antes[campo]
    const d = despues[campo]
    if (JSON.stringify(a ?? null) === JSON.stringify(d ?? null)) continue
    if (campo === 'globalDiscountPercent') cambios.push({ campo: etiqueta, antes: `${a ?? 0}%`, despues: `${d ?? 0}%` })
    else if (campo === 'featuredIds') cambios.push({ campo: etiqueta, antes: (a as string[]).join(', ') || '—', despues: (d as string[]).join(', ') || '—' })
    else cambios.push({ campo: etiqueta, antes: texto(a), despues: texto(d) })
  }
  if (cambios.length) registrar(actor, { tipo: 'ajustes', accion: 'modificó', resumen: 'Cambió la configuración de la tienda.', cambios })
}

type PedidoMin = { id: string; nombre: string; estado: string; subtotal: number }

export function registrarPedidos(actor: Actor, antes: PedidoMin[], despues: PedidoMin[]) {
  const despuesPorId = new Map(despues.map((p) => [p.id, p]))
  const antesPorId = new Map(antes.map((p) => [p.id, p]))
  for (const pedido of despues) {
    const previo = antesPorId.get(pedido.id)
    if (previo && previo.estado !== pedido.estado) {
      registrar(actor, {
        tipo: 'pedido',
        accion: 'cambió estado',
        resumen: `Cambió el estado del pedido de ${pedido.nombre}.`,
        cambios: [{ campo: 'Estado', antes: previo.estado, despues: pedido.estado }],
      })
    }
  }
  for (const pedido of antes) {
    if (!despuesPorId.has(pedido.id)) registrar(actor, { tipo: 'pedido', accion: 'eliminó', resumen: `Eliminó el pedido de ${pedido.nombre}.` })
  }
}
