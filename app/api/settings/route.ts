import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { requestHasValidSession } from '@/lib/auth'
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

async function readSettings(): Promise<Settings> {
  try {
    return { ...initialSettings, ...JSON.parse(await fs.readFile(settingsPath, 'utf8')) } as Settings
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
  const validImage = typeof v.heroImage === 'string' && (
    /^\/[a-zA-Z0-9_./-]+$/.test(v.heroImage) ||
    /^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s]*)?$/.test(v.heroImage)
  )
  return typeof v.whatsapp === 'string' && /^\d{0,15}$/.test(v.whatsapp)
    && typeof v.heroTitleTop === 'string' && v.heroTitleTop.length <= 60
    && typeof v.heroTitleAccent === 'string' && v.heroTitleAccent.length <= 60
    && typeof v.heroCopy === 'string' && v.heroCopy.length <= 300
    && validImage
    && typeof v.globalDiscountPercent === 'number' && Number.isInteger(v.globalDiscountPercent) && v.globalDiscountPercent >= 0 && v.globalDiscountPercent <= 90
    && Array.isArray(v.featuredIds) && v.featuredIds.length <= 4 && v.featuredIds.every((id) => typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id))
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
  if (!requestHasValidSession(request)) return NextResponse.json({ error: 'Debes iniciar sesión en el panel para cambiar la configuración.' }, { status: 401 })
  try {
    const value: unknown = await request.json()
    if (!validSettings(value)) return NextResponse.json({ error: 'Revisa los datos de configuración.' }, { status: 400 })
    await fs.mkdir(path.dirname(settingsPath), { recursive: true })
    const temporaryPath = `${settingsPath}.${randomUUID()}.tmp`
    await fs.writeFile(temporaryPath, JSON.stringify(value, null, 2), 'utf8')
    await fs.rename(temporaryPath, settingsPath)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar la configuración.' }, { status: 500 })
  }
}
