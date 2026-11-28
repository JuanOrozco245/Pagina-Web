/**
 * Iconos propios de la navegación, con trazo fino y el rombo y el destello del logo,
 * en lugar de los iconos genéricos de lucide (casa, cuadrícula y globo de chat).
 */
type IconProps = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
  'aria-hidden': true,
})

/** Inicio: el destello de cuatro puntas de la marca. */
export function SparkIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />
      <path d="M18.5 16.5c.2 1.3.7 1.8 2 2-1.3.2-1.8.7-2 2-.2-1.3-.7-1.8-2-2 1.3-.2 1.8-.7 2-2Z" className="nav-icon-accent" />
    </svg>
  )
}

/** Catálogo: cuatro rombos, como piezas en vitrina. */
export function GalleryIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m7.5 3 3.5 4.5L7.5 12 4 7.5Z" className="nav-icon-gem a" />
      <path d="m16.5 3 3.5 4.5-3.5 4.5L13 7.5Z" className="nav-icon-gem b" />
      <path d="m7.5 12 3.5 4.5L7.5 21 4 16.5Z" className="nav-icon-gem c" />
      <path d="m16.5 12 3.5 4.5-3.5 4.5-3.5-4.5Z" className="nav-icon-gem d" />
    </svg>
  )
}

/** Contacto: globo de conversación con un pequeño destello dentro. */
export function MessageIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 11.5C4 7.4 7.6 4.5 12 4.5s8 2.9 8 7-3.6 7-8 7c-1 0-2-.1-2.9-.4L5 19.5l1.2-3.4C4.8 14.9 4 13.3 4 11.5Z" />
      <path d="M12 9c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z" className="nav-icon-accent" />
    </svg>
  )
}
