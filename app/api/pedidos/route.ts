import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { registrarPedidos } from '@/lib/historial'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ordersPath = path.join(process.cwd(), 'data', 'pedidos.json')
const ESTADOS = ['pendiente', 'enviado', 'entregado']

type OrderItem = { productId: string; name: string; quantity: number; price: number; cost?: number | null }
export type Pedido = {
  id: string
  fecha: string
  nombre: string
  whatsapp: string
  items: OrderItem[]
  subtotal: number
  estado: string
  nota?: string
}

function isLocalRequest(request: Request) {
  const host = request.headers.get('host')?.split(':')[0]?.replace(/^\[|\]$/g, '')
  const origin = request.headers.get('origin')
  if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') return false
  if (!origin) return request.method === 'GET'
  try {
    return new URL(origin).hostname === host
  } catch {
    return false
  }
}

async function readOrders(): Promise<Pedido[]> {
  try {
    const value = JSON.parse(await fs.readFile(ordersPath, 'utf8'))
    return Array.isArray(value) ? value as Pedido[] : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    await fs.mkdir(path.dirname(ordersPath), { recursive: true })
    await fs.writeFile(ordersPath, '[]', 'utf8')
    return []
  }
}

async function writeOrders(orders: Pedido[]) {
  await fs.mkdir(path.dirname(ordersPath), { recursive: true })
  const temporaryPath = `${ordersPath}.${randomUUID()}.tmp`
  await fs.writeFile(temporaryPath, JSON.stringify(orders, null, 2), 'utf8')
  await fs.rename(temporaryPath, ordersPath)
}

function validOrder(value: unknown): value is Pedido {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<Pedido>
  return typeof v.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(v.id)
    && typeof v.fecha === 'string' && v.fecha.length <= 40
    && typeof v.nombre === 'string' && v.nombre.trim().length > 0 && v.nombre.length <= 100
    && typeof v.whatsapp === 'string' && /^\d{0,15}$/.test(v.whatsapp)
    && Array.isArray(v.items) && v.items.length > 0 && v.items.length <= 50
    && v.items.every((item) => item && typeof item.productId === 'string' && typeof item.name === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isInteger(item.price) && item.price >= 0 && (item.cost === undefined || item.cost === null || (Number.isInteger(item.cost) && item.cost >= 0)))
    && typeof v.subtotal === 'number' && Number.isInteger(v.subtotal) && v.subtotal >= 0
    && typeof v.estado === 'string' && ESTADOS.includes(v.estado)
    && (v.nota === undefined || (typeof v.nota === 'string' && v.nota.length <= 500))
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Los pedidos locales solo están disponibles en tu equipo.' }, { status: 404 })
  if (!getSessionUser(request)) return NextResponse.json({ error: 'Debes iniciar sesión en el panel para ver los pedidos.' }, { status: 401 })
  try {
    return NextResponse.json(await readOrders(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'No se pudieron leer los pedidos.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Los pedidos locales solo están disponibles en tu equipo.' }, { status: 404 })
  try {
    const value: unknown = await request.json()
    if (!validOrder(value)) return NextResponse.json({ error: 'Revisa los datos del pedido.' }, { status: 400 })
    const orders = await readOrders()
    if (orders.length >= 500) return NextResponse.json({ error: 'Se alcanzó el límite de pedidos.' }, { status: 400 })
    await writeOrders([value, ...orders])
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar el pedido.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'Los pedidos locales solo están disponibles en tu equipo.' }, { status: 404 })
  const user = getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión en el panel para modificar los pedidos.' }, { status: 401 })
  try {
    const value: unknown = await request.json()
    if (!Array.isArray(value) || value.length > 500 || !value.every(validOrder)) {
      return NextResponse.json({ error: 'Revisa los datos de los pedidos.' }, { status: 400 })
    }
    const previous = await readOrders()
    await writeOrders(value)
    registrarPedidos(user, previous, value)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudieron guardar los pedidos.' }, { status: 500 })
  }
}
