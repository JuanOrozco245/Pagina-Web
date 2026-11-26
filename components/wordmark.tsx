import Link from 'next/link'
import { Gem } from 'lucide-react'

/** Logotipo único de ZÉNIT. Se usa igual en tienda, pie, login y panel. */
export function Wordmark({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`wordmark ${className}`.trim()} aria-label="ZENIT Joyería, inicio">
      <span className="wordmark-mark" aria-hidden="true">
        <Gem size={21} strokeWidth={1.15} />
        <span className="wordmark-spark">✦</span>
      </span>
      <span className="wordmark-type">
        <span className="wordmark-name">ZÉNIT</span>
        <small>JOYERÍA</small>
      </span>
    </Link>
  )
}
