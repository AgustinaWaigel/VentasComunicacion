# Todas las páginas y panel de venta

## Corrección principal

El panel derecho crecía con cada artículo y su posición sticky dejaba el botón fuera de pantalla. Ahora tiene tres zonas: encabezado, contenido desplazable y pie con ganancia, total y registro. La altura disponible se calcula según la posición real del panel y el alto de la ventana; se actualiza al desplazar y redimensionar. El pie no se desplaza con los artículos. En celular se mantiene el registro en la barra inferior.

Se probó una venta con 12 artículos en 1366×768, 1024×600 y 1440×900: el botón permanece dentro del viewport, incluso tras desplazar el contenido interno. El POST simulado contiene las 12 líneas y se envía una sola vez.

## Refinamiento de todas las páginas con Impeccable

Se preservaron identidad IAM, azul marino, grises claros, tipografía grande y controles táctiles. Los patrones de cabecera, campos, mensajes, filtros y registros ahora se comparten en `AdminUI.tsx` y el CSS común.

- Ventas: panel con pie visible y contenido desplazable; mantiene dos clics, cantidades, pagos y deuda.
- Agregar producto: etiquetas asociadas, validación, precios/stock agrupados, vista previa y límite de imagen. Se revocan las URLs temporales de fotos. Se eliminó la indicación de arrastrar archivos, porque no existía esa función.
- Productos: filtros y datos legibles; borrador separado para editar; cancelar conserva los valores originales. Guardar comprueba el estado HTTP y conserva los cambios pendientes ante un fallo. Se puede editar nombre, categoría, precios, stock y foto.
- Eventos: filtros por nombre y estado, formulario unificado y resultados desplegables en la página. Conserva creación, edición, activación/desactivación y estadísticas.
- Historial: filtros, resumen, detalle por venta, exportación Excel general y por evento. Edita medio de pago, efectivo y deuda. Total y ganancia siguen visibles como datos calculados; la API existente no persiste su edición manual, aunque la interfaz anterior mostraba esos campos como editables. Se evita prometer una edición que no se guarda.
- Eliminación múltiple: valida cada respuesta; si falla una, conserva las restantes e informa las ya eliminadas. Los filtros restablecen la selección para no eliminar registros ocultos.
- Cargas: distingue consulta en curso, lista vacía y error; permite reintentar. XLSX se descarga únicamente al exportar.

## Validación

- `npm run build` y `npx tsc -b`: correctos.
- `npm run test:sales`: registro de ventas, medios de pago, stock, deuda y móvil correctos.
- `node tests/impeccable-browser.mjs`: teclado, contraste, estados y cuatro anchos correctos.
- `npm run test:pages`: panel con 12 productos, todas las páginas a 320/390/1440 px, alta de producto, guardar/cancelar/reintentar edición, crear/editar/desactivar evento, estadísticas, editar cobro, descarga XLSX, fallo parcial de eliminación y reintento de carga.
- Sin errores JavaScript ni desbordamiento horizontal en los tamaños comprobados.
- Capturas en `docs/all-pages-*.png`, resultados en `docs/all-pages-checks.json`.
- Las escrituras de las pruebas fueron interceptadas. No se crearon productos, eventos o ventas reales ni se modificó stock de producción.

Archivos principales: las cinco páginas de `src/pages`, `src/components/AdminUI.tsx`, `src/hooks/useApiList.ts`, `src/index.css`, `tests/all-pages-browser.mjs` y el comando `test:pages` en `package.json`.
