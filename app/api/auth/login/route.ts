import { NextResponse } from 'next/server'
import { checkAdminPassword, createSessionToken, hasAdminConfig, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export const runtime = 'nodejs'

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 403 })
  }
  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'El panel aún no está configurado. Define ADMIN_PASSWORD y ADMIN_SESSION_SECRET en .env.local.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions())
  return response
}
