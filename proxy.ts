import { NextResponse, type NextRequest } from 'next/server'
import { requestHasValidSession } from '@/lib/auth'

const ADMIN_PAGES = [
  '/admin',
  '/configuracion',
  '/inventario',
  '/pedidos',
  '/clientes',
  '/reportes',
  '/respaldo',
]

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = requestHasValidSession(request)

  if (ADMIN_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))) {
    if (authenticated) return NextResponse.next()
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Las operaciones de escritura y la lectura de datos privados se protegen
  // también en el servidor, no solo en la interfaz.
  let requiresAuth = false
  if (pathname.startsWith('/api/catalog')) requiresAuth = !READ_ONLY_METHODS.has(request.method)
  if (pathname.startsWith('/api/settings')) requiresAuth = !READ_ONLY_METHODS.has(request.method)
  if (pathname.startsWith('/api/pedidos')) requiresAuth = request.method !== 'POST'

  if (requiresAuth && !authenticated) {
    return NextResponse.json({ error: 'Debes iniciar sesión en el panel para realizar esta acción.' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/configuracion/:path*',
    '/inventario/:path*',
    '/pedidos/:path*',
    '/clientes/:path*',
    '/reportes/:path*',
    '/respaldo/:path*',
    '/api/catalog/:path*',
    '/api/settings/:path*',
    '/api/pedidos/:path*',
  ],
}
