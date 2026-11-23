export type Product = {
  id: string
  category: string
  name: string
  description: string
  price: number | null
  discountPercent: number
  image: string
  cost?: number | null
  stock?: number | null
}

/** Únicas categorías permitidas en el catálogo. */
export const CATEGORIES = ['Anillos', 'Cadenas', 'Manillas', 'Topos'] as const
export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

export const initialProducts: Product[] = [
  { id: 'virgen-medalla-classic', category: 'Topos', name: 'Medalla clásica', description: 'Relieve dorado con un acabado delicado.', price: 290000, discountPercent: 0, image: '/images/zenit-medallion.png', cost: null, stock: null },
  { id: 'virgen-medalla-petite', category: 'Topos', name: 'Medalla petite', description: 'Una versión sutil para llevar todos los días.', price: 260000, discountPercent: 0, image: '/images/zenit-medallion.png', cost: null, stock: null },
  { id: 'bolsita-suerte', category: 'Topos', name: 'Bolsita de la suerte', description: 'Un pequeño amuleto en acabado dorado.', price: 300000, discountPercent: 0, image: '/images/zenit-pouch.png', cost: null, stock: null },
  { id: 'rayos-dorados', category: 'Topos', name: 'Rayo dorado', description: 'Líneas luminosas con carácter.', price: 250000, discountPercent: 0, image: '/images/zenit-lightning.png', cost: null, stock: null },
  { id: 'corazon-mini', category: 'Topos', name: 'Corazón mini', description: 'Un clásico romántico de brillo suave.', price: 250000, discountPercent: 0, image: '/images/zenit-heart.png', cost: null, stock: null },
  { id: 'bolsita-relieve', category: 'Topos', name: 'Bolsita en relieve', description: 'Un diseño con textura y un toque especial.', price: 300000, discountPercent: 0, image: '/images/zenit-pouch.png', cost: null, stock: null },
  { id: 'clover-rayado', category: 'Topos', name: 'Clover rayado', description: 'Destellos geométricos en cada pétalo.', price: 352000, discountPercent: 0, image: '/images/zenit-clover.png', cost: null, stock: null },
  { id: 'clover-petalos', category: 'Topos', name: 'Clover de pétalos', description: 'Un diseño floral de acabado luminoso.', price: 310000, discountPercent: 0, image: '/images/zenit-clover.png', cost: null, stock: null },
  { id: 'corazon-volumen', category: 'Topos', name: 'Corazón de volumen', description: 'Un corazón dorado, protagonista y brillante.', price: 350000, discountPercent: 0, image: '/images/zenit-heart.png', cost: null, stock: null },
  { id: 'bolsita-mini', category: 'Topos', name: 'Bolsita de la suerte mini', description: 'Un amuleto pequeño con acabado dorado.', price: 250000, discountPercent: 0, image: '/images/zenit-pouch.png', cost: null, stock: null },
  { id: 'cruz-dorada', category: 'Topos', name: 'Cruz dorada', description: 'Un detalle delicado de líneas definidas.', price: 225000, discountPercent: 0, image: '/images/zenit-cross.png', cost: null, stock: null },
  { id: 'flor-textura', category: 'Topos', name: 'Flor texturizada', description: 'Pétalos con relieve y reflejos dorados.', price: 260000, discountPercent: 0, image: '/images/zenit-flower.png', cost: null, stock: null },
  { id: 'corazon-pulido', category: 'Topos', name: 'Corazón pulido', description: 'Curvas suaves con un acabado espejo.', price: 260000, discountPercent: 0, image: '/images/zenit-heart.png', cost: null, stock: null },
  { id: 'corazon-radial', category: 'Topos', name: 'Corazón radial', description: 'Facetas que reflejan la luz desde el centro.', price: 360000, discountPercent: 0, image: '/images/zenit-radial-heart.png', cost: null, stock: null },
  { id: 'virgen-ovalada', category: 'Topos', name: 'Medalla ovalada', description: 'Un diseño clásico con borde ornamentado.', price: 315000, discountPercent: 0, image: '/images/zenit-medallion.png', cost: null, stock: null },
  { id: 'virgen-marco', category: 'Topos', name: 'Medalla con marco', description: 'Detalle en relieve con silueta delicada.', price: 280000, discountPercent: 0, image: '/images/zenit-medallion.png', cost: null, stock: null },
  { id: 'argollas-varias', category: 'Topos', name: 'Argollas doradas', description: 'Seis diseños · medidas de 1 a 1,4 cm · pesos de 0,7 a 0,92 g.', price: null, discountPercent: 0, image: '/images/zenit-hoops.png', cost: null, stock: null },
]

export function discountedPrice(product: Product) {
  if (product.price === null) return null
  return Math.round(product.price * (100 - product.discountPercent) / 100)
}

export function isSoldOut(product: Product) {
  return product.stock !== null && product.stock !== undefined && product.stock <= 0
}
