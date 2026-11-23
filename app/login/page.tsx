import type { Metadata } from 'next'
import Link from 'next/link'
import { Gem } from 'lucide-react'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: 'Acceso al panel · ZENIT Joyería',
  robots: { index: false, follow: false },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: requested } = await searchParams
  const next = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/admin'

  return (
    <main className="login-shell">
      <section className="login-card">
        <Link href="/" className="login-brand" aria-label="ZENIT Joyería, inicio">
          <span className="wordmark-mark" aria-hidden="true"><Gem size={20} strokeWidth={1.15} /><span className="wordmark-spark">✦</span></span>
          <span><span className="wordmark-name">ZÉNIT</span><small>JOYERÍA</small></span>
        </Link>
        <p className="admin-eyebrow">ZONA PRIVADA</p>
        <h1>Acceso al <em>panel.</em></h1>
        <p className="admin-lede">Esta área está protegida. Ingresa la contraseña definida en la configuración del servidor para gestionar la tienda.</p>
        <LoginForm next={next} />
        <Link href="/" className="login-back">← Volver a la tienda</Link>
      </section>
    </main>
  )
}
