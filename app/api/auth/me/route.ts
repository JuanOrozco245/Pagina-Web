import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { defaultAdminIsActive } from '@/lib/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Sin sesión.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  // `claveDePrueba` avisa en el panel mientras la cuenta admin siga con la contraseña inicial.
  const claveDePrueba = user.usuario === 'admin' && (await defaultAdminIsActive())
  return NextResponse.json({ usuario: user.usuario, nombre: user.nombre, rol: user.rol, claveDePrueba }, { headers: { 'Cache-Control': 'no-store' } })
}
