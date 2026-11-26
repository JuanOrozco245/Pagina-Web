import { randomBytes, randomUUID, scrypt as scryptCallback, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

/**
 * Almacén de usuarios del panel. Vive en data/usuarios.json (ignorado por Git).
 * Las contraseñas NUNCA se guardan en texto: solo un hash con sal (scrypt).
 */
export type Rol = 'dueno' | 'empleado'

export type UserRecord = {
  usuario: string
  nombre: string
  rol: Rol
  hash: string
  creado: string
  activo: boolean
}

/** Lo que se puede mostrar en pantalla (sin el hash). */
export type PublicUser = Omit<UserRecord, 'hash'>

export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/
export const MIN_PASSWORD = 8
export const MAX_PASSWORD = 200

const usersPath = path.join(process.cwd(), 'data', 'usuarios.json')
const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

export function readUsers(): UserRecord[] {
  try {
    const value = JSON.parse(readFileSync(usersPath, 'utf8'))
    return Array.isArray(value) ? (value as UserRecord[]) : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

function writeUsers(users: UserRecord[]) {
  mkdirSync(path.dirname(usersPath), { recursive: true })
  const temporaryPath = `${usersPath}.${randomUUID()}.tmp`
  writeFileSync(temporaryPath, JSON.stringify(users, null, 2), { encoding: 'utf8', mode: 0o600 })
  renameSync(temporaryPath, usersPath)
}

export function hasUsers() {
  return readUsers().length > 0
}

/**
 * Cuenta inicial para probar el panel cuando todavía no existe ninguna.
 * Solo se crea si el archivo de usuarios está vacío; luego puede cambiarse
 * la contraseña desde /usuarios.
 */
export async function ensureDefaultAdmin() {
  if (hasUsers()) return
  const user: UserRecord = {
    usuario: 'admin',
    nombre: 'Administrador',
    rol: 'dueno',
    hash: await hashPassword('Admin'),
    creado: new Date().toISOString(),
    activo: true,
  }
  writeUsers([user])
}

export function findUser(usuario: string) {
  const wanted = usuario.trim().toLowerCase()
  return readUsers().find((user) => user.usuario === wanted) ?? null
}

/**
 * Indica si la cuenta de prueba `admin` sigue usando la contraseña inicial.
 * El login muestra la pista solo mientras eso sea cierto; al cambiarla desaparece.
 */
export async function defaultAdminIsActive() {
  const user = findUser('admin')
  if (!user || !user.activo) return false
  return verifyPassword('Admin', user.hash)
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { hash: _hash, ...rest } = user
  return rest
}

export function normalizeUsername(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string') return 'Escribe una contraseña.'
  if (password.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
  if (password.length > MAX_PASSWORD) return 'La contraseña es demasiado larga.'
  return null
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltValue, hashValue] = stored.split('$')
  if (scheme !== 'scrypt' || !saltValue || !hashValue) return false
  const expected = Buffer.from(hashValue, 'base64')
  const derived = await scrypt(password, Buffer.from(saltValue, 'base64'), expected.length)
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

/**
 * Hace el mismo trabajo de comparación aunque el usuario no exista, para que
 * el tiempo de respuesta no delate qué usuarios están registrados.
 */
const DUMMY_HASH = `scrypt$${Buffer.alloc(16).toString('base64')}$${scryptSync('no-existe', Buffer.alloc(16), 64).toString('base64')}`
export async function checkCredentials(usuario: string, password: string): Promise<UserRecord | null> {
  const user = findUser(usuario)
  const ok = await verifyPassword(password, user?.hash ?? DUMMY_HASH)
  return user && user.activo && ok ? user : null
}

export type CreateUserInput = { usuario: string; nombre: string; password: string; rol: Rol }

export async function createUser(input: CreateUserInput): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const usuario = normalizeUsername(input.usuario)
  const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : ''
  if (!USERNAME_PATTERN.test(usuario)) return { ok: false, error: 'El usuario debe tener de 3 a 30 caracteres: letras minúsculas, números, guion o guion bajo.' }
  if (!nombre || nombre.length > 60) return { ok: false, error: 'Escribe un nombre (máximo 60 caracteres).' }
  const problem = passwordProblem(input.password)
  if (problem) return { ok: false, error: problem }
  const users = readUsers()
  if (users.some((user) => user.usuario === usuario)) return { ok: false, error: 'Ese usuario ya existe.' }
  const user: UserRecord = {
    usuario,
    nombre,
    rol: input.rol === 'dueno' ? 'dueno' : 'empleado',
    hash: await hashPassword(input.password),
    creado: new Date().toISOString(),
    activo: true,
  }
  writeUsers([...users, user])
  return { ok: true, user }
}

export async function updateUser(
  usuario: string,
  changes: { nombre?: string; rol?: Rol; activo?: boolean; password?: string },
): Promise<{ ok: true; user: UserRecord; before: UserRecord } | { ok: false; error: string }> {
  const users = readUsers()
  const index = users.findIndex((user) => user.usuario === usuario)
  if (index < 0) return { ok: false, error: 'No existe ese usuario.' }
  const before = users[index]
  const next: UserRecord = { ...before }
  if (changes.nombre !== undefined) {
    const nombre = changes.nombre.trim()
    if (!nombre || nombre.length > 60) return { ok: false, error: 'Escribe un nombre (máximo 60 caracteres).' }
    next.nombre = nombre
  }
  if (changes.rol !== undefined) next.rol = changes.rol === 'dueno' ? 'dueno' : 'empleado'
  if (changes.activo !== undefined) next.activo = Boolean(changes.activo)
  if (changes.password !== undefined) {
    const problem = passwordProblem(changes.password)
    if (problem) return { ok: false, error: problem }
    next.hash = await hashPassword(changes.password)
  }
  // Siempre debe quedar al menos un dueño activo.
  const owners = users.map((user, i) => (i === index ? next : user)).filter((user) => user.rol === 'dueno' && user.activo)
  if (owners.length === 0) return { ok: false, error: 'Debe quedar al menos un dueño activo.' }
  users[index] = next
  writeUsers(users)
  return { ok: true, user: next, before }
}
