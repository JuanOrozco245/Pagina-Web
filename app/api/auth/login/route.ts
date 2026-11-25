import { NextResponse } from 'next/server'
import {
  clearLoginFailures,
  createSessionToken,
  isLoginBlocked,
  isSameOrigin,
  loginKey,
  recordLoginFailure,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth'
import { registrar } from '@/lib/historial'
import { checkCredentials, hasUsers, normalizeUsername } from '@/lib/users'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 403 })
  }
  if (!hasUsers()) {
    return NextResponse.json({ error: 'Todavía no hay cuentas. Crea la cuenta del dueño desde la pantalla de acceso.' }, { status: 409 })
  }

  const body = (await request.json().catch(() => null)) as { usuario?: unknown; password?: unknown } | null
  const usuario = normalizeUsername(body?.usuario).slice(0, 30)
  const password = typeof body?.password === 'string' ? body.password.slice(0, 200) : ''
  if (!usuario || !password) {
    return NextResponse.json({ error: 'Escribe tu usuario y tu contraseña.' }, { status: 400 })
  }

  const key = loginKey(request, usuario)
  if (isLoginBlocked(key)) {
    return NextResponse.json({ error: 'Demasiados intentos fallidos. Espera unos 15 minutos e inténtalo de nuevo.' }, { status: 429 })
  }

  const user = await checkCredentials(usuario, password)
  if (!user) {
    recordLoginFailure(key)
    registrar({ usuario, nombre: '' }, { tipo: 'sesion', accion: 'intento fallido', resumen: `Intento fallido de inicio de sesión con el usuario “${usuario}”.` })
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
  }

  clearLoginFailures(key)
  registrar({ usuario: user.usuario, nombre: user.nombre }, { tipo: 'sesion', accion: 'inició sesión', resumen: 'Inició sesión.' })
  const response = NextResponse.json({ ok: true, nombre: user.nombre })
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions(request))
  return response
}
