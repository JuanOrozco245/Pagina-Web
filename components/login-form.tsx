'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
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
      <label htmlFor="admin-password">Contraseña del panel</label>
      <div className="login-password">
        <LockKeyhole size={15} strokeWidth={1.4} aria-hidden="true" />
        <input
          id="admin-password"
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          maxLength={200}
          placeholder="Escribe tu contraseña"
        />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {visible ? <EyeOff size={15} strokeWidth={1.4} /> : <Eye size={15} strokeWidth={1.4} />}
        </button>
      </div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button type="submit" className="admin-primary login-submit" disabled={loading}>
        {loading ? 'Verificando…' : 'Entrar al panel'} <ArrowRight size={15} strokeWidth={1.4} aria-hidden="true" />
      </button>
      <p className="login-hint">La sesión caduca automáticamente después de 8 horas.</p>
    </form>
  )
}
