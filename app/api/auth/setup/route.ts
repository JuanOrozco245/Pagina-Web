import { NextResponse } from 'next/server'
import { createSessionToken, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'
import { registrar } from '@/lib/historial'
import { createUser, hasUsers } from '@/lib/users'

export const runtime = 'nodejs'

function isLocalRequest(request: Request) {
  const host = request.headers.get('host')?.split(':')[0]?.replace(/^\[|\]$/g, '')
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

/**
 * Crea la cuenta del dueño la primera vez. Solo funciona mientras no exista
 * ninguna cuenta y únicamente desde este mismo equipo (localhost).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request) || !isLocalRequest(request)) {
    return NextResponse.json({ error: 'La cuenta del dueño solo se crea desde el equipo donde corre la tienda (localhost).' }, { status: 403 })
  }
  if (hasUsers()) {
    return NextResponse.json({ error: 'Ya existe una cuenta. Inicia sesión.' }, { status: 409 })
  }

  const body = (await request.json().catch(() => null)) as { usuario?: unknown; nombre?: unknown; password?: unknown } | null
  const result = await createUser({
    usuario: typeof body?.usuario === 'string' ? body.usuario : '',
    nombre: typeof body?.nombre === 'string' ? body.nombre : '',
    password: typeof body?.password === 'string' ? body.password : '',
    rol: 'dueno',
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  registrar({ usuario: result.user.usuario, nombre: result.user.nombre }, { tipo: 'usuario', accion: 'creó', resumen: 'Creó la cuenta del dueño.' })
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(result.user), sessionCookieOptions(request))
  return response
}
