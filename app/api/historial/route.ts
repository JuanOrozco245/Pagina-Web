import { NextResponse } from 'next/server'
import { getOwner } from '@/lib/auth'
import { leerHistorial } from '@/lib/historial'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!getOwner(request)) return NextResponse.json({ error: 'Solo el dueño puede ver el historial.' }, { status: 403 })
  const params = new URL(request.url).searchParams
  const limit = Number(params.get('limit')) || 100
  try {
    return NextResponse.json(
      leerHistorial({ limit, usuario: params.get('usuario') || undefined, tipo: params.get('tipo') || undefined }),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el historial.' }, { status: 500 })
  }
}
