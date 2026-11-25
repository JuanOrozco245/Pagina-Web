'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'

type Me = { usuario: string; nombre: string; rol: 'dueno' | 'empleado' }
type PublicUser = { usuario: string; nombre: string; rol: 'dueno' | 'empleado'; creado: string; activo: boolean }

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('No disponible')
  return response.json()
}

async function call(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la acción.')
  return result
}

export default function UsuariosPage() {
  const { data: me } = useSWR<Me>('/api/auth/me', fetcher)
  const isOwner = me?.rol === 'dueno'
  const { data: users = [], mutate } = useSWR<PublicUser[]>(isOwner ? '/api/usuarios' : null, fetcher)
  const [notice, setNotice] = useState('')

  // Cambiar mi propia contraseña
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [busy, setBusy] = useState(false)

  // Crear cuenta
  const [nuevo, setNuevo] = useState({ nombre: '', usuario: '', password: '', rol: 'empleado' as 'dueno' | 'empleado' })

  // Restablecer contraseña de otra persona
  const [resetFor, setResetFor] = useState('')
  const [resetValue, setResetValue] = useState('')

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true)
    setNotice('')
    try {
      await action()
      setNotice(success)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo completar la acción.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const changeOwnPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (nueva !== repetir) return setNotice('La contraseña nueva y su repetición no coinciden.')
    const ok = await run(() => call('/api/auth/password', 'POST', { actual, nueva }), 'Contraseña actualizada.')
    if (ok) { setActual(''); setNueva(''); setRepetir('') }
  }

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault()
    const ok = await run(async () => { await call('/api/usuarios', 'POST', nuevo); await mutate() }, `Cuenta de ${nuevo.nombre} creada.`)
    if (ok) setNuevo({ nombre: '', usuario: '', password: '', rol: 'empleado' })
  }

  const patch = (usuario: string, changes: Record<string, unknown>, success: string) =>
    run(async () => { await call('/api/usuarios', 'PATCH', { usuario, ...changes }); await mutate() }, success)

  const submitReset = async (usuario: string) => {
    const ok = await patch(usuario, { password: resetValue }, 'Contraseña restablecida. Avísale a la persona su nueva contraseña.')
    if (ok) { setResetFor(''); setResetValue('') }
  }

  return (
    <main className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        <div className="admin-title-row">
          <div>
            <p className="admin-eyebrow">{isOwner ? 'ADMINISTRACIÓN DE CUENTAS' : 'MI CUENTA'}</p>
            <h1>{isOwner ? <>Usuarios y <em>acceso.</em></> : <>Mi <em>cuenta.</em></>}</h1>
            <p className="admin-lede">{isOwner ? 'Crea una cuenta para cada persona de tu equipo. Todo lo que hagan queda anotado en el historial con su nombre.' : 'Aquí puedes cambiar tu contraseña.'}</p>
          </div>
          <Link href="/admin" className="admin-back">Ir al panel →</Link>
        </div>

        {notice && <p className="admin-notice" role="status">{notice}</p>}

        <div className="settings-form">
          <section className="settings-card">
            <h2>Cambiar mi contraseña</h2>
            <form onSubmit={changeOwnPassword}>
              <label>Contraseña actual<input type="password" value={actual} onChange={(event) => setActual(event.target.value)} autoComplete="current-password" required maxLength={200} /></label>
              <label>Contraseña nueva<input type="password" value={nueva} onChange={(event) => setNueva(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={200} /><small>Mínimo 8 caracteres.</small></label>
              <label>Repite la contraseña nueva<input type="password" value={repetir} onChange={(event) => setRepetir(event.target.value)} autoComplete="new-password" required maxLength={200} /></label>
              <button type="submit" className="admin-primary" disabled={busy}>Guardar contraseña</button>
            </form>
          </section>

          {isOwner && (
            <section className="settings-card">
              <h2>Crear cuenta nueva</h2>
              <form onSubmit={createUser}>
                <label>Nombre de la persona<input value={nuevo.nombre} onChange={(event) => setNuevo({ ...nuevo, nombre: event.target.value })} required maxLength={60} placeholder="Ej. María Gómez" /></label>
                <label>Usuario<input value={nuevo.usuario} onChange={(event) => setNuevo({ ...nuevo, usuario: event.target.value.toLowerCase() })} required minLength={3} maxLength={30} autoCapitalize="none" spellCheck={false} placeholder="Ej. maria" /><small>Minúsculas, números, guion o guion bajo. Sin espacios.</small></label>
                <label>Contraseña inicial<input type="text" value={nuevo.password} onChange={(event) => setNuevo({ ...nuevo, password: event.target.value })} required minLength={8} maxLength={200} autoComplete="off" /><small>Mínimo 8 caracteres. Pídele que la cambie en “Mi cuenta”.</small></label>
                <label>Rol
                  <select value={nuevo.rol} onChange={(event) => setNuevo({ ...nuevo, rol: event.target.value as 'dueno' | 'empleado' })}>
                    <option value="empleado">Empleado (gestiona productos y pedidos)</option>
                    <option value="dueno">Dueño (además ve el historial y administra cuentas)</option>
                  </select>
                </label>
                <button type="submit" className="admin-primary" disabled={busy}>Crear cuenta</button>
              </form>
            </section>
          )}

          {isOwner && (
            <section className="settings-card settings-wide">
              <h2>Cuentas del equipo</h2>
              <ul className="user-list">
                {users.map((user) => {
                  const isMe = user.usuario === me?.usuario
                  return (
                    <li key={user.usuario} className={user.activo ? '' : 'user-off'}>
                      <div className="user-info">
                        <strong>{user.nombre}{isMe ? ' (tú)' : ''}</strong>
                        <small>@{user.usuario} · {user.rol === 'dueno' ? 'Dueño' : 'Empleado'} · {user.activo ? 'Activa' : 'Desactivada'} · creada {new Date(user.creado).toLocaleDateString('es-CO')}</small>
                      </div>
                      <div className="user-actions">
                        {resetFor === user.usuario ? (
                          <>
                            <input type="text" value={resetValue} onChange={(event) => setResetValue(event.target.value)} placeholder="Nueva contraseña (mín. 8)" minLength={8} maxLength={200} aria-label={`Nueva contraseña para ${user.nombre}`} autoComplete="off" />
                            <button type="button" className="admin-primary" disabled={busy || resetValue.length < 8} onClick={() => submitReset(user.usuario)}>Guardar</button>
                            <button type="button" className="admin-secondary" onClick={() => { setResetFor(''); setResetValue('') }}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="admin-secondary" onClick={() => { setResetFor(user.usuario); setResetValue('') }}>Restablecer contraseña</button>
                            {!isMe && (
                              <button type="button" className="admin-secondary" disabled={busy} onClick={() => patch(user.usuario, { activo: !user.activo }, user.activo ? 'Cuenta desactivada.' : 'Cuenta reactivada.')}>
                                {user.activo ? 'Desactivar' : 'Reactivar'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
