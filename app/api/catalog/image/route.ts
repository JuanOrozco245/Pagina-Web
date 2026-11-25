import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { registrar } from '@/lib/historial'

export const runtime = 'nodejs'

function isLocalRequest(request: Request) {
  const host = request.headers.get('host')?.split(':')[0]?.replace(/^\[|\]$/g, '')
  if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') return false
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).hostname === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: 'La carga de imágenes solo está disponible en tu equipo.' }, { status: 404 })
  const user = getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión en el panel para subir imágenes.' }, { status: 401 })
  const formData = await request.formData()
  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Elige una imagen de hasta 5 MB.' }, { status: 400 })
  }
  const extensions: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' }
  const extension = extensions[file.type]
  if (!extension) return NextResponse.json({ error: 'Usa una imagen JPG, PNG, WebP o AVIF.' }, { status: 400 })
  const filename = `${randomUUID()}${extension}`
  const imageDirectory = path.join(process.cwd(), 'public', 'images', 'uploads')
  await fs.mkdir(imageDirectory, { recursive: true })
  await fs.writeFile(path.join(imageDirectory, filename), Buffer.from(await file.arrayBuffer()), { flag: 'wx' })
  registrar(user, { tipo: 'imagen', accion: 'subió', resumen: 'Subió una imagen al catálogo.' })
  return NextResponse.json({ image: `/images/uploads/${filename}` })
}
