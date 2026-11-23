import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { requestHasValidSession } from '@/lib/auth'
import { initialProducts, isCategory, type Product } from '@/lib/catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const catalogPath = path.join(process.cwd(), 'data', 'catalog.json')

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

async function readCatalog(): Promise<Product[]> {
  try {
    return JSON.parse(await fs.readFile(catalogPath, 'utf8')) as Product[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    await fs.mkdir(path.dirname(catalogPath), { recursive: true })
    await fs.writeFile(catalogPath, JSON.stringify(initialProducts, null, 2), 'utf8')
    return initialProducts
  }
}

function validProduct(product: unknown): product is Product {
  if (!product || typeof product !== 'object') return false
  const value = product as Partial<Product>
  const validImage = typeof value.image === 'string' && (
    /^\/[a-zA-Z0-9_./-]+$/.test(value.image) ||
    /^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s]*)?$/.test(value.image)
  )
  return typeof value.id === 'string' && /^[a-z0-9-]{1,80}$/.test(value.id)
    && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 100
    && typeof value.category === 'string' && isCategory(value.category)
    && typeof value.description === 'string' && value.description.length <= 500
    && (value.price === null || (Number.isInteger(value.price) && Number(value.price) > 0))
    && Number.isInteger(value.discountPercent) && Number(value.discountPercent) >= 0 && Number(value.discountPercent) <= 90
    && (value.cost === undefined || value.cost === null || (Number.isInteger(value.cost) && value.cost >= 0))
    && (value.stock === undefined || value.stock === null || (Number.isInteger(value.stock) && value.stock >= 0))
    && validImage
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'El catálogo editable solo está disponible en tu equipo.' }, { status: 404 })
  try {
    return NextResponse.json(await readCatalog(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el catálogo local.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'El catálogo editable solo está disponible en tu equipo.' }, { status: 404 })
  if (!requestHasValidSession(request)) return NextResponse.json({ error: 'Debes iniciar sesión en el panel para modificar el catálogo.' }, { status: 401 })
  try {
    const products: unknown = await request.json()
    if (!Array.isArray(products) || products.length > 500 || !products.every(validProduct)) {
      return NextResponse.json({ error: 'Revisa los datos del catálogo antes de guardar.' }, { status: 400 })
    }
    const ids = new Set((products as Product[]).map((product) => product.id))
    if (ids.size !== products.length) return NextResponse.json({ error: 'Cada producto necesita un identificador único.' }, { status: 400 })
    await fs.mkdir(path.dirname(catalogPath), { recursive: true })
    const temporaryPath = `${catalogPath}.${randomUUID()}.tmp`
    await fs.writeFile(temporaryPath, JSON.stringify(products, null, 2), 'utf8')
    await fs.rename(temporaryPath, catalogPath)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudieron guardar los cambios.' }, { status: 500 })
  }
}
