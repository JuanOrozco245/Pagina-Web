import type { Metadata } from 'next'
import Link from 'next/link'
import { Gem } from 'lucide-react'
import { LoginForm } from '@/components/login-form'
import { hasUsers } from '@/lib/users'

export const metadata: Metadata = {
  title: 'Acceso al panel · ZENIT Joyería',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: requested } = await searchParams
  const next = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/admin'
  const needsSetup = !hasUsers()

  return (
    <main className="login-shell">
      <section className="login-card">
        <Link href="/" className="login-brand" aria-label="ZENIT Joyería, inicio">
          <span className="wordmark-mark" aria-hidden="true"><Gem size={20} strokeWidth={1.15} /><span className="wordmark-spark">✦</span></span>
          <span><span className="wordmark-name">ZÉNIT</span><small>JOYERÍA</small></span>
        </Link>
        <p className="admin-eyebrow">{needsSetup ? 'PRIMERA VEZ' : 'ZONA PRIVADA'}</p>
        <h1>{needsSetup ? <>Crea tu cuenta de <em>dueño.</em></> : <>Acceso al <em>panel.</em></>}</h1>
        <p className="admin-lede">
          {needsSetup
            ? 'Aún no hay ninguna cuenta. Crea la tuya: será la del dueño y desde ella podrás crear cuentas para tu equipo y ver el historial de cambios.'
            : 'Esta área está protegida. Ingresa con tu usuario y contraseña para gestionar la tienda.'}
        </p>
        <LoginForm next={next} needsSetup={needsSetup} />
        <Link href="/" className="login-back">← Volver a la tienda</Link>
      </section>
    </main>
  )
}
