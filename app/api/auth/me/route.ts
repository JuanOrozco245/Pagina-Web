import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Sin sesión.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ usuario: user.usuario, nombre: user.nombre, rol: user.rol }, { headers: { 'Cache-Control': 'no-store' } })
}
