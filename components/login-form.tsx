'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole, User } from 'lucide-react'

export function LoginForm({ next, needsSetup }: { next: string; needsSetup: boolean }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (needsSetup && password !== confirm) {
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(needsSetup ? '/api/auth/setup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(needsSetup ? { usuario, nombre, password } : { usuario, password }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar sesión.')
      router.push(next)
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (
    <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
      {visible ? <EyeOff size={15} strokeWidth={1.4} /> : <Eye size={15} strokeWidth={1.4} />}
    </button>
  )

  return (
    <form className="login-form" onSubmit={submit}>
      {needsSetup && (
        <>
          <label htmlFor="setup-nombre">Tu nombre</label>
          <div className="login-password">
            <User size={15} strokeWidth={1.4} aria-hidden="true" />
            <input id="setup-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} required maxLength={60} autoComplete="name" placeholder="Ej. Juan Orozco" autoFocus />
          </div>
        </>
      )}

      <label htmlFor="admin-usuario">{needsSetup ? 'Elige un usuario' : 'Usuario'}</label>
      <div className="login-password">
        <User size={15} strokeWidth={1.4} aria-hidden="true" />
        <input
          id="admin-usuario"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={!needsSetup}
          required
          minLength={3}
          maxLength={30}
          placeholder={needsSetup ? 'Ej. juan (minúsculas, sin espacios)' : 'Tu usuario'}
        />
      </div>

      <label htmlFor="admin-password">{needsSetup ? 'Elige una contraseña' : 'Contraseña'}</label>
      <div className="login-password">
        <LockKeyhole size={15} strokeWidth={1.4} aria-hidden="true" />
        <input
          id="admin-password"
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={needsSetup ? 'new-password' : 'current-password'}
          required
          minLength={needsSetup ? 8 : undefined}
          maxLength={200}
          placeholder={needsSetup ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
        />
        {toggle}
      </div>

      {needsSetup && (
        <>
          <label htmlFor="setup-confirm">Repite la contraseña</label>
          <div className="login-password">
            <LockKeyhole size={15} strokeWidth={1.4} aria-hidden="true" />
            <input id="setup-confirm" type={visible ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required maxLength={200} placeholder="Escríbela otra vez" />
          </div>
        </>
      )}

      {error && <p className="login-error" role="alert">{error}</p>}
      <button type="submit" className="admin-primary login-submit" disabled={loading}>
        {loading ? 'Verificando…' : needsSetup ? 'Crear cuenta y entrar' : 'Entrar al panel'} <ArrowRight size={15} strokeWidth={1.4} aria-hidden="true" />
      </button>
      <p className="login-hint">
        {needsSetup ? 'Guarda bien tu contraseña: nadie más podrá verla ni recuperarla.' : 'La sesión caduca automáticamente después de 8 horas.'}
      </p>
    </form>
  )
}
