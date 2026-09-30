# Pulido con Impeccable

Se aplicó la skill instalada en `.agents/skills/impeccable/SKILL.md`, con las guías `polish`, `optimize`, `operate` y `craft-floor`. Es un refinamiento del punto de venta existente para la vendedora, no una tienda para compradores. Se preservaron azul marino, logo, controles grandes, los medios de pago y el registro simple en dos clics.

## Rendimiento: evidencia y límite del arreglo

La revisión anterior está en `revision-ventas.md`. Se volvió a medir antes de editar:

- API pública: primera respuesta **22,8156 s**, siguiente **0,3045 s**. La ruta raíz, que no consulta la base, respondió en **0,2630 s** con el servidor ya activo.
- Medición pública anterior: **41,7908 s** y luego **0,7092 s**, sin cambios desplegados entre esas consultas.
- API local antes de Impeccable: primera conexión **1,380 s**; cuatro consultas activas **0,233–0,234 s**. `Server-Timing` atribuyó 229–230 ms a PostgreSQL y aproximadamente 0 ms a serialización. JSON: 34 productos, 3.846 bytes.
- Navegador local antes: conexión inicial **1,240 s**; activas **0,261–0,286 s**.
- Navegador local después: primera consulta del test funcional **1,201 s**; seis consultas activas, entre escritorio y celular emulado, **0,259–0,279 s**.

Los tiempos activos son equivalentes dentro de la variación de red. No se atribuye al pulido un ahorro de decenas de segundos. La espera pública ocurre antes del primer byte y es consistente con la suspensión/reactivación del servicio Render Free. Referencia: https://render.com/docs/free#spinning-down-on-idle. Sin logs del proveedor no se puede repartir exactamente el tiempo de arranque entre infraestructura y aplicación.

**La corrección de infraestructura está preparada en `render.yaml` (`starter` y `/health`), pero no fue desplegada ni se contrató un plan pago. La espera en producción no puede darse por eliminada hasta aplicarla al servicio correcto y medir una primera visita tras inactividad.** No se cambió la URL ni se eludió la API accediendo directamente a la base desde el cliente.

Ajustes efectivos en el frontend:

- La actualización después de vender mantiene visibles los productos; bloquea el registro hasta verificar stock. No usa stock cacheado para habilitar ventas.
- El timeout anterior de 15 segundos podía cortar la respuesta antes de que terminara el arranque de Render. Ahora permite hasta 65 segundos y explica una espera prolongada a los 8 segundos. Esto evita un error prematuro; **no soluciona el arranque lento**.
- Timeout de 30 segundos en el registro. Si se pierde la respuesta, se solicita revisar el historial antes de repetir; no hay reenvío automático de ventas.
- Las primeras cuatro fotos usan carga inmediata; las restantes, diferida. Tamaño reservado, decodificación asíncrona y alternativa para imágenes faltantes.
- La API real no tiene foto en 33 productos, y la única foto referenciada devuelve 404. Se muestra esta ausencia con honestidad. No se generaron fotos ficticias.
- Se conserva la división de código por rutas. El JavaScript inicial final es aproximadamente 239,40 KB sin comprimir, frente a 591,74 KB al inicio del trabajo original; no se incorporaron React Bits ni dependencias visuales.

`performance-impeccable-before.json` y `performance-impeccable-after.json` guardan las muestras. La medida visible empieza en el fetch y termina tras dos frames, no incluye toda la navegación ni garantiza el tiempo de carga de cada foto. Son pruebas locales de Chromium con tamaños móviles, no mediciones en un teléfono físico. En desarrollo React StrictMode cancela una petición inicial; las entradas sin `Server-Timing` de esos archivos corresponden a ese intento cancelado.

## Qué cambió con Impeccable

- El evento se ve arriba, antes de agregar productos o registrar desde celular.
- Jerarquía simplificada, sin etiquetas decorativas sobre los títulos ni paneles anidados alrededor de las tarjetas.
- Filtro de categoría compacto en celular; búsqueda con botón para borrar y coincidencias sin tildes.
- Botones identifican el producto para lectores de pantalla; foco visible, controles táctiles y números alineados.
- La barra móvil permite elegir efectivo o transferencia y registrar directamente; informa unidades, total y deuda cuando corresponde.
- Avisos de error y éxito visibles en la pantalla actual, con cierre explícito y acceso al historial en otra pestaña ante un error.
- Mejor contraste de placeholders, bordes, estados seleccionados y textos secundarios; tokens para superficies y controles.
- Se conserva el flujo de dos clics y la edición de cantidades, vuelto, deuda, evento y ganancia estimada.

## Verificación

- `npm run build`, `npx tsc -b` y `git diff --check`: correctos.
- `npm run test:sales`: 34 productos reales; navegación a las cinco pantallas; dos clics con un POST; bloqueo de doble envío; stock máximo; agrupación de cantidades; efectivo, transferencia, vuelto y deuda; fallos y recuperación.
- `node tests/impeccable-browser.mjs`: 320, 390, 768 y 1440 px sin desbordamiento, nombres largos, operación por teclado, búsqueda sin tildes, selección móvil de pago sincronizada, lista visible durante actualización y error móvil dentro del viewport.
- Contraste calculado sobre estilos renderizados: nombre/precio **11,44:1**, disponibilidad **6,27:1**, categoría y placeholder **5,48:1**.
- Dos rondas visuales acotadas (escritorio y celular), conforme a la skill. Capturas finales de la venta con datos de prueba: `impeccable-mobile-sale.png`, `impeccable-desktop-sale.png`.
- Todos los POST de pruebas fueron interceptados. No se registraron ventas reales ni se modificó stock de producción.

Archivos de esta pasada: `src/pages/AgregarVentass.tsx`, `src/components/Navbar.tsx`, `src/index.css`, `tests/sales-browser.mjs`, `tests/measure-page.mjs`, `tests/impeccable-browser.mjs` y evidencias en `docs/`.

Opcional para futuras iteraciones: `/impeccable init` permite guardar el contexto del producto y sus decisiones visuales. No fue necesario para pulir esta pantalla existente.
