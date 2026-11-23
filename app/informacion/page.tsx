import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Información legal y políticas · ZENIT Joyería' }

const sections = [
  { id: 'privacidad', title: 'Política de privacidad' },
  { id: 'terminos', title: 'Términos y condiciones' },
  { id: 'compras', title: 'Políticas de compra' },
  { id: 'envios', title: 'Envíos' },
  { id: 'devoluciones', title: 'Cambios y devoluciones' },
]

export default function InformacionPage() {
  return (
    <main className="public-shell">
      <section className="catalog-intro">
        <p className="eyebrow">INFORMACIÓN IMPORTANTE</p>
        <h1>Políticas <em>y condiciones.</em></h1>
        <p>Aquí se publicarán las políticas comerciales y legales de la tienda. Los textos definitivos deben ser redactados y aprobados por ZENIT Joyería.</p>
      </section>
      <div className="info-notice">
        <strong>Contenido pendiente de completar.</strong>
        <p>Para no inventar información legal ni condiciones comerciales, los apartados siguientes están deliberadamente vacíos. Completa cada sección con la información real antes de publicar la tienda.</p>
      </div>
      <section className="faq-list info-list">
        {sections.map((section) => (
          <article className="faq-item" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            <p className="info-placeholder">Pendiente de redactar por ZENIT Joyería.</p>
          </article>
        ))}
      </section>
      <section className="catalog-intro info-contact">
        <p className="eyebrow">¿NECESITAS AYUDA?</p>
        <h2>Consulta directa.</h2>
        <p>La información de contacto, correo, dirección y redes sociales está señalada como pendiente en el pie de página. El enlace de WhatsApp se activa cuando se configura el número desde el panel.</p>
        <Link href="/#contacto" className="underlined-link">Ir al contacto <ArrowUpRight size={14} strokeWidth={1.4} /></Link>
      </section>
    </main>
  )
}
