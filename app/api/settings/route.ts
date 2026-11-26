import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { registrarAjustes } from '@/lib/historial'
import { initialSettings, type Settings } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const settingsPath = path.join(process.cwd(), 'data', 'settings.json')

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

/** Solo se conservan los datos de venta; los ajustes viejos de la web se descartan. */
function normalizeSettings(value: unknown): Settings {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<Settings>
  const whatsapp = typeof v.whatsapp === 'string' ? v.whatsapp.replace(/[^\d]/g, '').slice(0, 15) : ''
  const discount = Number(v.globalDiscountPercent)
  return {
    whatsapp,
    globalDiscountPercent: Number.isInteger(discount) && discount >= 0 && discount <= 90 ? discount : 0,
  }
}

async function readSettings(): Promise<Settings> {
  try {
    return normalizeSettings(JSON.parse(await fs.readFile(settingsPath, 'utf8')))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    await fs.mkdir(path.dirname(settingsPath), { recursive: true })
    await fs.writeFile(settingsPath, JSON.stringify(initialSettings, null, 2), 'utf8')
    return initialSettings
  }
}

function validSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<Settings>
  return typeof v.whatsapp === 'string' && /^\d{0,15}$/.test(v.whatsapp)
    && typeof v.globalDiscountPercent === 'number' && Number.isInteger(v.globalDiscountPercent) && v.globalDiscountPercent >= 0 && v.globalDiscountPercent <= 90
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'La configuración local solo está disponible en tu equipo.' }, { status: 404 })
  try {
    return NextResponse.json(await readSettings(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'No se pudo leer la configuración.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'La configuración local solo está disponible en tu equipo.' }, { status: 404 })
  const user = getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión en el panel para cambiar la configuración.' }, { status: 401 })
  try {
    const value: unknown = await request.json()
    if (!validSettings(value)) return NextResponse.json({ error: 'Revisa los datos de venta.' }, { status: 400 })
    const previous = await readSettings()
    const next = normalizeSettings(value)
    await fs.mkdir(path.dirname(settingsPath), { recursive: true })
    const temporaryPath = `${settingsPath}.${randomUUID()}.tmp`
    await fs.writeFile(temporaryPath, JSON.stringify(next, null, 2), 'utf8')
    await fs.rename(temporaryPath, settingsPath)
    registrarAjustes(user, previous, next)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar la configuración.' }, { status: 500 })
  }
}
