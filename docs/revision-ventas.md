# Revisión de ventas de Comunicación IAM

## Resultado

La pantalla es un punto de venta para la vendedora. Venta simple en dos clics: **Agregar → Registrar venta**. Efectivo es el valor inicial; transferencia, evento, cantidades, vuelto y deuda se editan en la misma pantalla. No se abre un modal obligatorio. El botón móvil permite registrar sin bajar hasta el resumen. Se mantiene la API de ventas existente.

Se aplicaron azules marino, celestes y grises suaves, tipografía principal de 16–18 px, precios destacados y controles de 44–56 px a ventas, alta de productos, edición, eventos e historial. Se conservó el logo existente.

## Demora: qué se midió

Mediciones realizadas el 28/09/2026, sin registrar ventas en la base real.

| Recorrido | Resultado |
| --- | --- |
| Primera consulta a la API pública en Render | 41,7908 s; primer byte 41,7903 s |
| Misma API pública, ya activa, sin cambios desplegados | 0,7092 s |
| Respuesta | 34 productos, 3.846 bytes |
| API local corregida, primera consulta con conexión nueva | 1,277 s; base 1.269 ms |
| API local, cinco muestras posteriores | 1.194 / 231 / 230 / 227 / 230 ms |
| Consulta a PostgreSQL con conexión activa | 225–227 ms, incluida latencia de red |
| Parseo JSON en esas cinco muestras | 0,034–0,082 ms |
| Navegador con código final, desde inicio del fetch hasta productos pintados | 1,340 s, 34 productos reales |
| Única imagen referenciada por la API pública | HTTP 404 en 0,318 s |

La diferencia de 41,79 a 0,71 segundos fue observada **en la misma versión pública**, por lo que no se presenta como una mejora causada por el rediseño. La configuración existente usaba `plan: free`. Render documenta la suspensión después de 15 minutos sin tráfico y una reactivación cercana al minuto: https://render.com/docs/free#spinning-down-on-idle. Los datos son consistentes con ese arranque en frío; no se dispone de logs de la infraestructura para descomponer esos 41,79 segundos.

El endpoint hace una sola consulta `findMany`, sin joins ni procesamiento pesado. Productos y eventos ya se pedían en paralelo. Las imágenes se cargan después de recibir los datos; no bloquean la aparición del nombre, precio o stock. No hay evidencia de que el renderizado o el tamaño del JSON causen la espera de casi un minuto.

## Correcciones

- `render.yaml`: configuración preparada con `plan: starter` y `/health`, para evitar la suspensión del servidor. **No se desplegó ni contrató el plan pago.** Hasta aplicar esta configuración en el servicio realmente usado por `VITE_API_URL`, la primera visita a Render Free puede seguir demorando. Los nombres del Blueprint y la URL de respaldo difieren: comprobar que se actualiza el servicio correcto antes de desplegar.
- API local: el proceso iniciado durante el trabajo tenía restringido el acceso a PostgreSQL (`EACCES`). Se reinició con acceso de red. Esto resolvió el HTTP 500 local; no era un error de las credenciales ni del diseño.
- CORS: se agregó `http://127.0.0.1:3000`, además de `localhost:3000`, para que el navegador pueda leer la API desde ambas direcciones.
- `Server-Timing` separa consulta y serialización. `performance.getEntriesByName('iam:productos-visibles')` permite medir la carga visible. La medida del navegador empieza con el fetch, no con la navegación completa.
- Administración e historial se cargan por ruta. Con las mismas versiones del lockfile, el JS inicial bajó de **591,74 KB a 236,87 KB** (aproximadamente 60%). El módulo XLSX del historial ya no entra en la carga inicial de ventas.
- Imágenes con dimensiones, carga diferida y alternativa si fallan. 33 productos no tenían imagen y la única URL existente devuelve 404: no se inventaron fotografías. Se agregó caché para las imágenes que sí existan; no se cachea stock.
- Estados de carga, fallo, reintento, lista vacía y búsqueda sin resultados. Los errores se muestran en pantalla.
- Los productos repetidos se agrupan; se impiden cantidades mayores al stock e inválidas. El envío se bloquea mientras está en curso. Se conservan los productos si falla una venta y se actualiza stock después de una respuesta exitosa.

## Comprobaciones

- `npm run build` y `npx tsc -b`: correctos.
- Backend: `npm run build` y `npx tsc`: correctos.
- `npm run test:sales`: correcto en Chromium. Lee productos reales, abre las cinco pantallas, comprueba ausencia de desbordamiento horizontal en celular y luego intercepta la API para probar escrituras sin afectar la base.
- Casos: dos clics / un POST; doble clic protegido; evento; efectivo; agrupación de líneas; cantidad máxima; vuelto; transferencia; deuda; error conservando venta; reintento; sin productos; búsqueda vacía; registro móvil a 390 px y ausencia de desbordamiento a 320 px.
- Las escrituras de estas pruebas son simuladas. No se creó una venta real ni se verificó una transacción de producción.

Reproducir con frontend en `http://127.0.0.1:3000` y backend en `http://localhost:5000`:

```sh
npm ci
npx playwright install chromium
npm run test:sales
npm run measure:products
```

`TEST_BASE_URL` cambia el frontend para pruebas; `TEST_API_URL` cambia el destino de las mediciones de API. La API debe estar activa y accesible antes de ejecutar. Resultados de navegador en `docs/browser-results.json`; capturas en `docs/ventas-desktop.png` y `docs/ventas-mobile.png` (esta última usa productos de prueba).

## Archivos modificados

- `src/pages/AgregarVentass.tsx`: registro directo, productos, cantidades, cobro y estados de carga.
- `src/pages/AgregarProducto.tsx`, `EditarProductos.tsx`, `Eventos.tsx`, `VerVentas.tsx`: adaptación visual conservando su lógica.
- `src/components/Navbar.tsx`, `Layout.tsx`, `src/index.css`: navegación e identidad visual compartida.
- `src/App.tsx`: carga por rutas.
- `backend/src/index.ts`, `backend/src/routes/productos.ts`: CORS, tiempos, salud y caché de imágenes.
- `render.yaml`: configuración propuesta sin suspensión.
- `package.json`, `package-lock.json`, `tests/sales-browser.mjs`, `tests/measure-products.cjs`: herramientas de comprobación.

No se modificaron `.env`, credenciales, esquemas ni datos de producción.
