import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { findUser, toPublicUser, type PublicUser } from '@/lib/users'

/**
 * Autenticación del panel con usuario y contraseña.
 *
 * La sesión es una cookie firmada que dice quién eres (usuario) y hasta cuándo
 * vale. La clave con la que se firma se crea sola la primera vez y se guarda en
 * data/session.key (ignorado por Git). Opcionalmente puede venir de la variable
 * de entorno ADMIN_SESSION_SECRET.
 */
export const SESSION_COOKIE = 'zenit_admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 horas
const SESSION_VERSION = '2'
const keyPath = path.join(process.cwd(), 'data', 'session.key')

let cachedSecret = ''
function secret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET
  if (cachedSecret) return cachedSecret
  try {
    cachedSecret = readFileSync(keyPath, 'utf8').trim()
  } catch {
    cachedSecret = ''
  }
  if (cachedSecret.length >= 32) return cachedSecret
  mkdirSync(path.dirname(keyPath), { recursive: true })
  const generated = randomBytes(48).toString('base64url')
  try {
    writeFileSync(keyPath, generated, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    cachedSecret = generated
  } catch {
    // Otro proceso la creó al mismo tiempo: usamos la suya.
    cachedSecret = readFileSync(keyPath, 'utf8').trim()
  }
  return cachedSecret
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload, 'utf8').digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** Huella corta de la contraseña actual: si cambia la contraseña, las sesiones viejas dejan de valer. */
function passwordStamp(hash: string) {
  return createHmac('sha256', secret()).update(`stamp:${hash}`, 'utf8').digest('base64url').slice(0, 12)
}

export function createSessionToken(user: { usuario: string; hash: string }) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000
  const payload = `${SESSION_VERSION}.${user.usuario}.${expiresAt}.${passwordStamp(user.hash)}`
  return `${payload}.${sign(payload)}`
}

/** Devuelve el usuario dueño de la sesión, o null si la sesión no es válida. */
export function verifySessionToken(token: string | undefined | null): PublicUser | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 5) return null
  const [version, usuario, expiresAt, stamp, signature] = parts
  if (version !== SESSION_VERSION) return null
  const timestamp = Number(expiresAt)
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return null
  const payload = `${version}.${usuario}.${expiresAt}.${stamp}`
  if (!safeEqual(signature, sign(payload))) return null
  const user = findUser(usuario)
  if (!user || !user.activo) return null
  if (!safeEqual(stamp, passwordStamp(user.hash))) return null
  return toPublicUser(user)
}

export function sessionCookieOptions(request?: Request) {
  const host = request?.headers.get('host')?.split(':')[0] ?? ''
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  return {
    httpOnly: true,
    // Las cookies "secure" solo viajan por HTTPS; en localhost se permite HTTP.
    secure: process.env.NODE_ENV === 'production' && !isLocalhost,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

/** Para rutas API y el proxy: lee la cookie de la petición y devuelve el usuario con sesión válida. */
export function getSessionUser(request: Request): PublicUser | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)
  try {
    return verifySessionToken(decodeURIComponent(token || ''))
  } catch {
    return null
  }
}

export function requestHasValidSession(request: Request) {
  return getSessionUser(request) !== null
}

/** Solo el dueño: devuelve el usuario o null. */
export function getOwner(request: Request) {
  const user = getSessionUser(request)
  return user?.rol === 'dueno' ? user : null
}

/** Las peticiones que cambian datos deben venir de nuestra propia página. */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/* ---------- Límite de intentos de inicio de sesión (contra adivinar contraseñas) ---------- */
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const failures = new Map<string, { count: number; first: number }>()

export function loginKey(request: Request, usuario: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  return `${forwarded}|${usuario}`
}

export function isLoginBlocked(key: string) {
  const entry = failures.get(key)
  if (!entry) return false
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key)
    return false
  }
  return entry.count >= MAX_FAILURES
}

export function recordLoginFailure(key: string) {
  const entry = failures.get(key)
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() })
  else entry.count += 1
}

export function clearLoginFailures(key: string) {
  failures.delete(key)
}
