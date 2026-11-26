import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/login-form'
import { Wordmark } from '@/components/wordmark'
import { headers } from 'next/headers'
import { defaultAdminIsActive, ensureDefaultAdmin } from '@/lib/users'

export const metadata: Metadata = {
  title: 'Acceso al panel · ZENIT Joyería',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: requested } = await searchParams
  const next = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/admin'
  // La cuenta de prueba (admin / Admin) existe desde la primera visita, pero la pista
  // con la contraseña solo se muestra al abrir la página en este mismo equipo (localhost):
  // nunca a los visitantes de una página publicada en internet.
  await ensureDefaultAdmin()
  const host = ((await headers()).get('host') ?? '').split(':')[0]
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  const showTestHint = isLocal && (await defaultAdminIsActive())

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
