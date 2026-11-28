/**
 * Transiciones entre el catálogo y la ficha de producto (React <ViewTransition>).
 * Los estilos de cada animación están en app/globals.css, sección "Transiciones entre páginas".
 */

/** Nombre compartido de la foto de una pieza: igual en la tarjeta del catálogo y en la ficha. */
export const pieceTransitionName = (id: string) => `pieza-${id}`

/**
 * Animación del resto de la página según la dirección: "nav-forward" al entrar a una ficha,
 * "nav-back" al volver al catálogo. Las navegaciones sin tipo (atrás del navegador) no se animan.
 */
export const PAGE_MOTION = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

/**
 * Solo la foto de la pieza que se abrió lleva nombre compartido; si todas lo llevaran,
 * varias fotos volarían a la vez. Se recuerda aquí para que, al volver, la foto regrese a su tarjeta.
 */
let activePiece: string | null = null
export const getActivePiece = () => activePiece
export const setActivePiece = (id: string) => { activePiece = id }
