# Registro de cambios — ZÉNIT Joyería

Aquí anotamos cada modificación del proyecto con su fecha. Para agregar una entrada, copia el formato de abajo.

## Formato

```md
## YYYY-MM-DD
- Cambio 1.
- Cambio 2.
```

---

## 2026-11-19

**Reestructura principal**

- Se creó este archivo `CAMBIOS.md` para llevar el historial de modificaciones con fechas.
- La página de inicio ya **no muestra todo el catálogo**. Ahora muestra solo una sección de **Bestsellers** (configurable) con un enlace a la página completa.
- Se creó la página `http://localhost:3000/productos` con el catálogo completo, buscador y filtros por categoría.
- Se crean fichas individuales en `http://localhost:3000/productos/[id]` con imagen grande, descripción, precio y botón para agregar a la bolsa.
- Se creó `http://localhost:3000/configuracion` para editar: número de WhatsApp, texto e imagen del inicio, descuento general y qué productos son bestsellers. **Redes sociales queda pendiente** (no se tocó Instagram).
- Se creó `http://localhost:3000/pedidos` para registrar y cambiar el estado de las solicitudes (pendiente, enviado, entregado).
- Se creó `http://localhost:3000/clientes` con el listado de clientes a partir de los pedidos.
- Se creó `http://localhost:3000/reportes` con resumen de pedidos, ingresos y productos más solicitados.
- Se creó `http://localhost:3000/respaldo` para descargar y restaurar el catálogo con un clic.
- Se creó `http://localhost:3000/preguntas-frecuentes` con envíos, materiales y cuidados.
- Se agregó un menú de navegación interno en todas las páginas de administración.
- Se movió el carrito a un componente compartido: ahora funciona también desde el catálogo y las fichas de producto.
- Se agregó control de **inventario** (stock opcional por producto) y aviso de *Agotado* cuando llega a cero.
- Se agregaron **flechas para subir/bajar productos** en el panel `/admin`, para cambiar el orden del catálogo.
- Todos los enlaces de WhatsApp ahora usan el número configurado en `/configuracion` (si se deja vacío, mantienen el comportamiento anterior).

**Verificación**

- Revisión de TypeScript sin errores y compilación de producción correcta.

**Pendiente para después**

- Redes sociales: configurar Instagram y demás redes desde el panel (se deja para el final, según indicación).

**Archivos locales ignorados por Git**

- `data/settings.json` y `data/pedidos.json` se suman a la lista de archivos no versionados, igual que `data/catalog.json`.

---

## 2026-11-19 (segunda actualización)

**Inventario masivo y rentabilidad**

- Se creó `http://localhost:3000/inventario` con **descarga del inventario en CSV** (abre en Excel), **plantilla vacía** y **carga masiva**.
- La carga masiva permite **actualizar y agregar** productos o **reemplazar todo**, con vista previa y validación de errores antes de aplicar.
- El CSV acepta columnas en español o inglés: `id, categoria, nombre, descripcion, precio, descuento, costo, stock, imagen`.
- Se agregó el campo **costo** a cada producto, editable en `/admin` y en la carga masiva.
- `/admin` ahora muestra **costo, utilidad y margen** por producto, además del valor de venta y la utilidad potencial del catálogo.
- `/pedidos` muestra la **utilidad por pedido** y el total acumulado.
- `/reportes` muestra **ingresos, costos, utilidad y margen**, un resumen del catálogo y las piezas más pedidas con su utilidad.
- Los pedidos guardan el costo de cada producto al momento de la solicitud, para que los reportes históricos sean precisos.

**Nota:** los costos empiezan vacíos. Cárgalos en `/admin` o con el CSV para ver utilidad y margen reales.

---

## 2026-11-19 (tercera actualización)

- Se separó el símbolo del nombre **ZÉNIT** en la cabecera de la tienda y del panel (más espacio entre el ícono y la palabra).
- Se agregó un acceso discreto a `/admin` en el pie de la página principal y de las páginas públicas.

---

## 2026-11-19 (cuarta actualización)

- Se separó un poco más el símbolo del nombre **ZÉNIT** (tienda y panel).
- El enlace “Acceso al panel” del pie de página usa un tono tenue para no llamar la atención de los clientes.

---

## 2026-11-22

**Rediseño, navegación, footer y seguridad del panel**

- Se unificó la cabecera en todas las páginas públicas (`components/site-header.tsx`): mismo logotipo, mismo sistema de iconos y orden exacto Inicio · Catálogo · Best Sellers · Contacto.
- La sección “La marca” salió del inicio y se trasladó después de Best Sellers como una sección editorial `#historia`, con narrativa, cita y composición de imágenes.
- Best Sellers muestra ahora **4 productos en una sola fila** en escritorio, con imágenes más compactas y adaptación a 2 columnas en tablet y 1 columna en móvil pequeño.
- El catálogo usa únicamente **Anillos, Cadenas, Manillas y Topos**. Se crearon tarjetas visuales de categoría, se reorganizaron los 17 productos existentes en `Topos` y se restringió la categoría en el panel, la carga CSV y la API.
- Se agregó un **footer completo y compartido** (`components/site-footer.tsx`) en todas las páginas: marca, exploración, contacto, compraventa, redes, copyright y acceso al panel. La información que no existe (correo, dirección, teléfono, redes, créditos) aparece marcada como **pendiente**, sin inventarla.
- Se creó `/informacion` con apartados de privacidad, términos, compras, envíos y devoluciones, todos marcados como pendientes de redacción.
- **Seguridad del panel:** se encontró que las rutas y las API administrativas eran públicas; solo se comprobaba que la petición viniera de localhost. Se implementó inicio de sesión con contraseña en `.env.local`, cookie de sesión firmada HMAC (HttpOnly, SameSite=Lax, 8 h), `proxy.ts` que bloquea páginas y API administrativas, verificación adicional dentro de cada Route Handler y cierre de sesión.
- Se añadieron `.env.example` y `.env.local` (ignorado por Git) con credenciales generadas localmente.

**Verificación**

- `tsc --noEmit` y `next build` correctos.
- Pruebas HTTP: `/admin` sin sesión redirige a `/login`; `PUT /api/catalog`, `PUT /api/settings` y `GET /api/pedidos` sin sesión devuelven 401; con sesión devuelven 200; cookie manipulada y logout invalidan el acceso; `POST /api/pedidos` público sigue funcionando.

**Pendiente de información del cliente**

- Redactar textos legales y de políticas en `/informacion`.
- Completar correo, dirección, horarios, redes sociales y créditos de diseño/desarrollo en el footer.
- Agregar productos reales a Anillos, Cadenas y Manillas: hoy no existen piezas de esas categorías en el catálogo y se muestran como “Próximamente”.
- La generación de una imagen nueva falló por credenciales del servicio de imágenes; la sección de historia usa imágenes existentes de `public/images`. Reemplazar por una fotografía editorial propia cuando esté disponible.

---

## 2026-11-25

**Inicio y catálogo centrados en producto**

- El inicio ahora abre con un bloque compacto (440 px) y un producto destacado; se eliminó el espacio vacío que había antes del contenido.
- Se quitaron los textos largos del inicio: queda un título corto, una línea de apoyo y dos acciones (catálogo y WhatsApp).
- La sección “Nuestra historia” se eliminó por completo del inicio y del pie de página.
- Los bestsellers del inicio son los **primeros 4 productos del catálogo**, en el orden que se define desde `/admin`. Ya no se eligen desde configuración.
- Se añadió una franja grande “Ir al catálogo” después de los bestsellers para empujar la venta hacia el catálogo completo.
- El catálogo ahora muestra los productos casi de inmediato: se quitaron las tarjetas gigantes de categoría, el encabezado es compacto y los filtros son una barra pequeña con buscador y chips.
- El catálogo usa 4 columnas en escritorio, 2 en tablet/móvil y 1 en pantallas muy pequeñas; las imágenes son cuadradas y las tarjetas muestran solo categoría, precio, nombre y acción.

**Cabecera, logo y bolsa**

- Se eliminó “Best Sellers” del menú superior; ahora solo quedan Inicio, Catálogo y Contacto.
- “Catálogo” se destaca como botón dorado en la cabecera.
- Se eliminó el botón de bolsa de la cabecera. La selección solo aparece como botón flotante cuando ya tiene productos, y el panel lateral pasó a llamarse “Tu selección”.
- Se creó `components/wordmark.tsx` y se usa el mismo logo, tamaño y tipografía en cabecera, pie, login y panel.

**Panel y acceso**

- El acceso quedó simplificado: solo usuario y contraseña. Se eliminó la pantalla de creación de cuenta.
- Cuenta de prueba local: **admin / Admin** (se puede cambiar desde `/usuarios`). La pista en el login se muestra solo mientras esa contraseña inicial siga activa.
- Si el archivo de usuarios está vacío, el sistema crea automáticamente esa cuenta inicial.
- La página de configuración se redujo a **Ventas**: solo número de WhatsApp y descuento general. Se eliminaron los campos de título, texto, imagen y selección de bestsellers.
- El menú del panel ahora dice “Ventas” en lugar de “Configuración”.

**Verificación**

- `tsc --noEmit` y `next build` correctos.
- Prueba HTTP: login con `admin / Admin` devuelve sesión válida; `/admin` y `/configuracion` responden 200 con sesión y redirigen a `/login` sin sesión.
- `GET/PUT /api/settings` funcionan solo con los campos de venta.

**Pendiente**

- Cambiar la contraseña de prueba `Admin` por una propia antes de publicar la tienda.
- Completar los textos legales y los datos de contacto/redes del pie de página.

---

## 2026-11-27

- Se agregaron al catálogo local 18 piezas con precio «Consultar» y costo 0, sin modificar los 17 registros anteriores.
- La baldosa de fotos del inicio muestra piezas del catálogo con un fundido y controles de pausa y avance. Con movimiento reducido solo se cambia de foto manualmente.
- En `/configuracion` se puede elegir una pieza destacada o dejar el inicio sin destacado. Ya no se muestra una medalla por defecto.
- Cinco fotos se incorporaron con copias de nombre compatible con el catálogo. Los originales se conservaron.
- Se corrigieron las rutas obsoletas y se retiraron las fichas con fotos repetidas. El catálogo local y el de respaldo muestran las mismas 21 fotos distintas, incluidas una sola medalla y una sola bolsita.

---

## 2026-11-28

**Rediseño del catálogo (`/productos`)**

- Se conserva la identidad (negro, dorado, Georgia y el logo), pero la página se rehízo por completo y ahora es compacta: en una laptop se ven 5 piezas completas al entrar.
- Cabecera de una sola franja con el título «La colección».
- Barra fija al bajar con las categorías en serif y su número de piezas (las vacías aparecen como «Pronto» y se ocultan en el celular), el número de piezas, el buscador (ignora tildes y mayúsculas) y el selector de orden (destacados, precio y nombre).
- Si hay una pieza destacada en `/configuracion`, abre el catálogo.
- Fotos cuadradas en una cuadrícula de 5 columnas en laptop y escritorio, 4 en pantallas de hasta 1280 px, 3 en tabletas y 2 en celular.
- Tarjeta: nombre en serif, categoría, precio y una sola acción (Añadir, Consultar o Sin stock).
- Cierre de la página con una frase de marca y un botón de asesoría por WhatsApp.
- Animaciones: las fotos se revelan como una cortina al aparecer en pantalla, brillo dorado mientras cargan, y al pasar el ratón la foto se acerca, aparece un marco dorado y el botón «Ver pieza». Se desactivan con «movimiento reducido».
- Se retiraron de `globals.css` las reglas antiguas del catálogo que ya no se usaban.

**Transición entre el catálogo y la ficha**

- Al abrir una pieza, su foto viaja desde la tarjeta hasta la ficha, mientras el resto de la página se desvanece y se desliza hacia la izquierda. Al usar «Volver al catálogo» ocurre lo contrario y la foto regresa a su tarjeta.
- La cabecera queda quieta durante la transición. Al volver, las tarjetas aparecen sin repetir su animación de entrada.
- Usa las transiciones de vista de React y Next.js (`lib/transitions.ts`). En navegadores sin soporte, la navegación funciona igual pero sin animación. Se desactiva con «movimiento reducido».

**Navegación principal**

- Iconos propios en lugar de los genéricos (casa, cuadrícula y globo): un destello para Inicio, cuatro rombos para Catálogo y un globo con destello para Contacto (`components/nav-icons.tsx`). Tienen trazo fino y se animan al pasar el ratón.
- Textos en mayúsculas espaciadas. La página activa ya no es un bloque dorado relleno: se marca con un subrayado dorado y un pequeño rombo.
- Contacto pasa a ser el botón de acción, con contorno dorado que se rellena al pasar el ratón. En celulares de hasta 420 px queda solo con su icono para que Catálogo conserve el texto.

**Página principal**

- Portada nueva a pantalla completa, sin recuadro: el anillo a la derecha con un brillo dorado suave y un destello de luz que lo cruza al cargar; a la izquierda, «Detalles que brillan contigo», los botones «Ver catálogo» y «Escríbenos por WhatsApp», y una línea con el número de diseños, la asesoría por WhatsApp y la entrega coordinada.
- Se retiraron las baldosas (Todo el catálogo, el carrusel de fotos y Asesoría personal) y la sección de pasos «Cómo comprar».
- Franja de piezas en movimiento continuo bajo la portada. Se detiene al pasar el ratón y cada foto lleva a su ficha. La pieza destacada de `/configuracion` aparece primero.
- Los best sellers usan la misma tarjeta del catálogo nuevo (`components/catalog-card.tsx`, compartida con `/productos`): 5 piezas en escritorio y 4 en pantallas más pequeñas, con la misma transición de la foto hacia la ficha.
- Cierre «¿Buscas algo especial?» con botón de WhatsApp y órbitas doradas girando despacio. Conserva el ancla `#contacto` del menú.
- Se quitó el indicador animado de «bajar» al pie de la portada.

**Ver el sitio desde el celular**

- `next.config.mjs` permite en desarrollo las direcciones de la red local (`192.168.*.*` y `10.*.*.*`), para abrir el sitio desde el celular en la misma red Wi-Fi.
