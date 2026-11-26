import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/login-form'
import { Wordmark } from '@/components/wordmark'
import { defaultAdminIsActive } from '@/lib/users'

export const metadata: Metadata = {
  title: 'Acceso al panel · ZENIT Joyería',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: requested } = await searchParams
  const next = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/admin'
  const showTestHint = await defaultAdminIsActive()

  return (
    <main className="login-shell">
      <section className="login-card">
        <Wordmark className="login-brand" />
        <p className="admin-eyebrow">ZONA PRIVADA</p>
        <h1>Acceso al <em>panel.</em></h1>
        <p className="admin-lede">Ingresa con tu usuario y contraseña para gestionar productos, pedidos y ventas.</p>
        <LoginForm next={next} showTestHint={showTestHint} />
        <Link href="/" className="login-back">← Volver a la tienda</Link>
      </section>
    </main>
  )
}
