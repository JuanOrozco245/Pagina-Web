export type Settings = {
  whatsapp: string
  heroTitleTop: string
  heroTitleAccent: string
  heroCopy: string
  heroImage: string
  globalDiscountPercent: number
  featuredIds: string[]
}

export const initialSettings: Settings = {
  whatsapp: '',
  heroTitleTop: 'Un detalle que',
  heroTitleAccent: 'brilla contigo.',
  heroCopy: 'Descubre nuestros topitos y aretas doradas: pequeños detalles para regalar, combinar y hacer tuyos.',
  heroImage: '/images/atelier-hero.png',
  globalDiscountPercent: 0,
  featuredIds: ['corazon-mini', 'bolsita-suerte', 'clover-rayado', 'corazon-radial'],
}

export function finalPrice(product: { price: number | null; discountPercent: number }, settings: Settings) {
  if (product.price === null) return null
  const percent = Math.min(90, (product.discountPercent || 0) + (settings.globalDiscountPercent || 0))
  return Math.round(product.price * (100 - percent) / 100)
}

export function totalPercent(product: { discountPercent: number }, settings: Settings) {
  return Math.min(90, (product.discountPercent || 0) + (settings.globalDiscountPercent || 0))
}

export function profit(product: { price: number | null; discountPercent: number; cost?: number | null }, settings: Settings) {
  const price = finalPrice(product, settings)
  if (price === null || product.cost === null || product.cost === undefined) return null
  return price - product.cost
}

export function margin(product: { price: number | null; discountPercent: number; cost?: number | null }, settings: Settings) {
  const price = finalPrice(product, settings)
  const utilidad = profit(product, settings)
  if (price === null || price === 0 || utilidad === null) return null
  return Math.round((utilidad / price) * 100)
}

export function whatsappLink(text: string, settings: Settings) {
  const encoded = encodeURIComponent(text)
  const number = settings.whatsapp.replace(/[^\d]/g, '')
  return number ? `https://wa.me/${number}?text=${encoded}` : `https://wa.me/?text=${encoded}`
}
