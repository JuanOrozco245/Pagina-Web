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
  {"id":"topos-alas-de-aurora","category":"Topos","name":"Alas de Aurora","description":"Topos con forma de alas y una silueta delicada.","price":null,"discountPercent":0,"image":"/images/zenit-alas.jpg","cost":0,"stock":null},
  {"id":"argollas-aura","category":"Topos","name":"Argollas Aura","description":"Argollas de silueta curva para combinar con otras piezas.","price":null,"discountPercent":0,"image":"/images/zenit-argollas.png","cost":0,"stock":null},
  {"id":"topos-corazon-abrazo","category":"Topos","name":"Corazón Abrazo","description":"Topos de corazón con volumen y curvas redondeadas.","price":null,"discountPercent":0,"image":"/images/zenit-corazon-3d.jpg","cost":0,"stock":null},
  {"id":"topos-corazon-latido","category":"Topos","name":"Corazón Latido","description":"Topos de corazón con un contorno suave.","price":null,"discountPercent":0,"image":"/images/zenit-corazon-sin-fondo.jpg","cost":0,"stock":null},
  {"id":"topos-corazon-serenata","category":"Topos","name":"Corazón Serenata","description":"Topos de corazón de estilo clásico.","price":null,"discountPercent":0,"image":"/images/zenit-corazon.jpg","cost":0,"stock":null},
  {"id":"topos-cruces-de-luz","category":"Topos","name":"Cruces de Luz","description":"Topos en forma de cruz, con líneas definidas.","price":null,"discountPercent":0,"image":"/images/zenit-cruces.jpg","cost":0,"stock":null},
  {"id":"topos-cruz-destello","category":"Topos","name":"Cruz Destello","description":"Topos con motivo de cruz y detalles brillantes.","price":null,"discountPercent":0,"image":"/images/zenit-cruz-con-diamantes.jpg","cost":0,"stock":null},
  {"id":"topos-estrellas-de-alba","category":"Topos","name":"Estrellas de Alba","description":"Topos de estrella para sumar un detalle de luz.","price":null,"discountPercent":0,"image":"/images/zenit-estrellas.jpg","cost":0,"stock":null},
  {"id":"topos-flores-de-abril","category":"Topos","name":"Flores de Abril","description":"Topos con motivo floral y un contorno de pétalos.","price":null,"discountPercent":0,"image":"/images/zenit-flores.png","cost":0,"stock":null},
  {"id":"topos-huellas-de-miel","category":"Topos","name":"Huellitas de Miel","description":"Topos con motivo de huellitas.","price":null,"discountPercent":0,"image":"/images/zenit-huellitas.jpg","cost":0,"stock":null},
  {"id":"topos-luna-creciente","category":"Topos","name":"Luna Creciente","description":"Topos con silueta de media luna.","price":null,"discountPercent":0,"image":"/images/zenit-media-luna.jpg","cost":0,"stock":null},
  {"id":"topos-nubes-de-amanecer","category":"Topos","name":"Nubes de Amanecer","description":"Topos en forma de nube con curvas suaves.","price":null,"discountPercent":0,"image":"/images/zenit-nubes.jpg","cost":0,"stock":null},
  {"id":"topos-rayos-sol","category":"Topos","name":"Rayos de Sol","description":"Topos en forma de rayo con silueta angular.","price":null,"discountPercent":0,"image":"/images/zenit-rayos.png","cost":0,"stock":null},
  {"id":"topos-orbitas-de-luz","category":"Topos","name":"Órbitas de Luz","description":"Topos circulares con diseño decorativo.","price":null,"discountPercent":0,"image":"/images/zenit-circulos-con-diseno.jpg","cost":0,"stock":null},
  {"id":"topos-latido-dorado","category":"Topos","name":"Latido Dorado","description":"Topos con corazón en relieve y detalles decorativos.","price":null,"discountPercent":0,"image":"/images/zenit-corazon-3d-con-diseno.jpg","cost":0,"stock":null},
  {"id":"topos-susurro-de-amor","category":"Topos","name":"Susurro de Amor","description":"Topos con silueta plana de corazón y detalles decorativos.","price":null,"discountPercent":0,"image":"/images/zenit-corazon-plano-con-diseno.jpg","cost":0,"stock":null},
  {"id":"topos-cruz-de-aurora","category":"Topos","name":"Cruz de Aurora","description":"Topos en forma de cruz con diseño decorativo.","price":null,"discountPercent":0,"image":"/images/zenit-cruz-con-diseno.png","cost":0,"stock":null},
  {"id":"topos-nubes-de-ensueno","category":"Topos","name":"Nubes de Ensueño","description":"Topos en forma de nube con detalles decorativos.","price":null,"discountPercent":0,"image":"/images/zenit-nubes-con-diseno.png","cost":0,"stock":null},
  {"id":"virgen-medalla-classic","category":"Topos","name":"Medalla clásica","description":"Relieve dorado con un acabado delicado.","price":290000,"discountPercent":0,"image":"/images/zenit-medallion.png","cost":null,"stock":null},
  {"id":"bolsita-suerte","category":"Topos","name":"Bolsita de la suerte","description":"Un pequeño amuleto en acabado dorado.","price":300000,"discountPercent":0,"image":"/images/zenit-pouch.png","cost":null,"stock":null},
]

export function discountedPrice(product: Product) {
  if (product.price === null) return null
  return Math.round(product.price * (100 - product.discountPercent) / 100)
}

export function isSoldOut(product: Product) {
  return product.stock !== null && product.stock !== undefined && product.stock <= 0
}
