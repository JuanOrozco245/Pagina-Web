import { NextResponse } from 'next/server'
import { getOwner, isSameOrigin } from '@/lib/auth'
import { registrar } from '@/lib/historial'
import { createUser, readUsers, toPublicUser, updateUser, type Rol } from '@/lib/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noOwner = () => NextResponse.json({ error: 'Solo el dueño puede administrar usuarios.' }, { status: 403 })

export async function GET(request: Request) {
  if (!getOwner(request)) return noOwner()
  return NextResponse.json(readUsers().map(toPublicUser), { headers: { 'Cache-Control': 'no-store' } })
}

/** Crear una cuenta nueva (por ejemplo, para un empleado). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 403 })
  const owner = getOwner(request)
  if (!owner) return noOwner()

  const body = (await request.json().catch(() => null)) as { usuario?: unknown; nombre?: unknown; password?: unknown; rol?: unknown } | null
  const result = await createUser({
    usuario: typeof body?.usuario === 'string' ? body.usuario : '',
    nombre: typeof body?.nombre === 'string' ? body.nombre : '',
    password: typeof body?.password === 'string' ? body.password : '',
    rol: body?.rol === 'dueno' ? 'dueno' : 'empleado',
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  registrar(owner, {
    tipo: 'usuario',
    accion: 'creó',
    resumen: `Creó la cuenta de “${result.user.nombre}” (${result.user.usuario}) como ${result.user.rol === 'dueno' ? 'dueño' : 'empleado'}.`,
  })
  return NextResponse.json(toPublicUser(result.user), { status: 201 })
}

/** Cambiar nombre, rol, activar/desactivar o restablecer la contraseña de otra persona. */
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 403 })
  const owner = getOwner(request)
  if (!owner) return noOwner()

  const body = (await request.json().catch(() => null)) as {
    usuario?: unknown
    nombre?: unknown
    rol?: unknown
    activo?: unknown
    password?: unknown
  } | null
  const usuario = typeof body?.usuario === 'string' ? body.usuario : ''
  if (!usuario) return NextResponse.json({ error: 'Falta el usuario.' }, { status: 400 })

  const changes: { nombre?: string; rol?: Rol; activo?: boolean; password?: string } = {}
  if (typeof body?.nombre === 'string') changes.nombre = body.nombre
  if (body?.rol === 'dueno' || body?.rol === 'empleado') changes.rol = body.rol
  if (typeof body?.activo === 'boolean') changes.activo = body.activo
  if (typeof body?.password === 'string') changes.password = body.password

  const result = await updateUser(usuario, changes)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  const { before, user } = result
  if (changes.password !== undefined) {
    registrar(owner, { tipo: 'usuario', accion: 'restableció contraseña', resumen: `Restableció la contraseña de “${user.nombre}” (${user.usuario}).` })
  }
  if (changes.activo !== undefined && before.activo !== user.activo) {
    registrar(owner, { tipo: 'usuario', accion: user.activo ? 'activó' : 'desactivó', resumen: `${user.activo ? 'Reactivó' : 'Desactivó'} la cuenta de “${user.nombre}” (${user.usuario}).` })
  }
  if (changes.rol !== undefined && before.rol !== user.rol) {
    registrar(owner, {
      tipo: 'usuario',
      accion: 'cambió rol',
      resumen: `Cambió el rol de “${user.nombre}” (${user.usuario}).`,
      cambios: [{ campo: 'Rol', antes: before.rol === 'dueno' ? 'Dueño' : 'Empleado', despues: user.rol === 'dueno' ? 'Dueño' : 'Empleado' }],
    })
  }
  if (changes.nombre !== undefined && before.nombre !== user.nombre) {
    registrar(owner, {
      tipo: 'usuario',
      accion: 'cambió nombre',
      resumen: `Cambió el nombre de la cuenta ${user.usuario}.`,
      cambios: [{ campo: 'Nombre', antes: before.nombre, despues: user.nombre }],
    })
  }
  return NextResponse.json(toPublicUser(user))
}
