'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole, User } from 'lucide-react'

export function LoginForm({ next, showTestHint }: { next: string; showTestHint: boolean }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
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

  return (
    <form className="login-form" onSubmit={submit}>
      <label htmlFor="admin-usuario">Usuario</label>
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
          autoFocus
          required
          maxLength={30}
          placeholder="Tu usuario"
        />
      </div>

      <label htmlFor="admin-password">Contraseña</label>
      <div className="login-password">
        <LockKeyhole size={15} strokeWidth={1.4} aria-hidden="true" />
        <input
          id="admin-password"
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          maxLength={200}
          placeholder="Tu contraseña"
        />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {visible ? <EyeOff size={15} strokeWidth={1.4} /> : <Eye size={15} strokeWidth={1.4} />}
        </button>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}
      <button type="submit" className="admin-primary login-submit" disabled={loading}>
        {loading ? 'Verificando…' : 'Entrar al panel'} <ArrowRight size={15} strokeWidth={1.4} aria-hidden="true" />
      </button>
      <p className="login-hint">
        {showTestHint ? 'Cuenta de prueba: admin · Contraseña: Admin' : 'La sesión caduca automáticamente después de 8 horas.'}
      </p>
    </form>
  )
}
