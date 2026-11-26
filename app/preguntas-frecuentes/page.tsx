import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Preguntas frecuentes · ZENIT Joyería' }

const faqs = [
  { q: '¿Cómo hago un pedido?', a: 'Elige la pieza que te guste, agrégala a tu selección y envía la solicitud con tu nombre. También puedes escribirnos directamente por WhatsApp para coordinar tu compra.' },
  { q: '¿Hacen envíos?', a: 'Sí. Los detalles de entrega se coordinan personalmente por WhatsApp según tu ciudad.' },
  { q: '¿Los productos son dorados?', a: 'Nuestra colección está compuesta por topitos y aretas en acabado dorado. Si necesitas detalles de materiales o cuidados, consúltanos antes de comprar.' },
  { q: '¿Cómo cuido mis joyas?', a: 'Guárdalas en un lugar seco, evita el contacto con perfumes o cremas y límpialas con un paño suave. Así conservan su brillo por más tiempo.' },
  { q: '¿Puedo consultar un precio sin comprar?', a: 'Claro. En los productos marcados como “Consultar” puedes escribirnos por WhatsApp y te damos el valor y la disponibilidad.' },
  { q: '¿Los precios están en pesos colombianos?', a: 'Sí. Todos los valores de la tienda están expresados en COP (pesos colombianos).' },
]

export default function PreguntasFrecuentesPage() {
  return (
    <main className="public-shell">
      <section className="catalog-intro"><p className="eyebrow">ANTES DE ESCRIBIRNOS</p><h1>Preguntas <em>frecuentes.</em></h1><p>Resolvemos las dudas más comunes sobre pedidos, envíos y cuidados.</p></section>
      <section className="faq-list">{faqs.map((faq) => <article className="faq-item" key={faq.q}><h2>{faq.q}</h2><p>{faq.a}</p></article>)}</section>
    </main>
  )
}
