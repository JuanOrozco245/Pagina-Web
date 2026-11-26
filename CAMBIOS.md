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
