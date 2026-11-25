import { NextResponse } from 'next/server'
import { createSessionToken, getSessionUser, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'
import { registrar } from '@/lib/historial'
import { findUser, updateUser, verifyPassword } from '@/lib/users'

export const runtime = 'nodejs'

/** Cada persona cambia su propia contraseña (necesita la actual). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 403 })
  const me = getSessionUser(request)
  if (!me) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { actual?: unknown; nueva?: unknown } | null
  const actual = typeof body?.actual === 'string' ? body.actual : ''
  const nueva = typeof body?.nueva === 'string' ? body.nueva : ''
  const record = findUser(me.usuario)
  if (!record || !(await verifyPassword(actual, record.hash))) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta.' }, { status: 400 })
  }
  const result = await updateUser(me.usuario, { password: nueva })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  registrar({ usuario: me.usuario, nombre: me.nombre }, { tipo: 'usuario', accion: 'cambió contraseña', resumen: 'Cambió su propia contraseña.' })
  // Cambiar la contraseña invalida las sesiones viejas: le damos una nueva a quien la cambió.
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, createSessionToken(result.user), sessionCookieOptions(request))
  return response
}
