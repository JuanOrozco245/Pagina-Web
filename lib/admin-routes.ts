/** Pantallas privadas del panel (la tienda pública no las muestra ni les pone su cabecera). */
export const ADMIN_PREFIXES = ['/admin', '/configuracion', '/inventario', '/pedidos', '/clientes', '/reportes', '/respaldo', '/usuarios', '/historial', '/login']

export function isAdminPath(pathname: string) {
  return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
