import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Autenticación del panel. Las credenciales y la clave de firma viven solo en
 * variables de entorno del servidor; nunca se envían al navegador.
 */
export const SESSION_COOKIE = 'zenit_admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 horas
const SESSION_VERSION = '1'

function secret() {
  return process.env.ADMIN_SESSION_SECRET || ''
}

function configuredPassword() {
  return process.env.ADMIN_PASSWORD || ''
}

export function hasAdminConfig() {
  return Boolean(secret() && configuredPassword())
}

function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest()
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** Comparación en tiempo constante del hash de la contraseña. */
export function checkAdminPassword(input: string) {
  if (!hasAdminConfig() || typeof input !== 'string' || input.length > 200) return false
  const provided = sha256(input).toString('hex')
  const expected = sha256(configuredPassword()).toString('hex')
  return safeEqual(provided, expected)
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload, 'utf8').digest('base64url')
}

export function createSessionToken() {
  if (!secret()) throw new Error('Falta ADMIN_SESSION_SECRET')
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000
  const payload = `${SESSION_VERSION}.${expiresAt}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token || !secret()) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [version, expiresAt, signature] = parts
  if (version !== SESSION_VERSION) return false
  const timestamp = Number(expiresAt)
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return false
  const payload = `${version}.${expiresAt}`
  return safeEqual(signature, sign(payload))
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

/** Para rutas API: lee y valida la cookie de sesión del encabezado de la petición. */
export function requestHasValidSession(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)
  try {
    return verifySessionToken(decodeURIComponent(token || ''))
  } catch {
    return false
  }
}
