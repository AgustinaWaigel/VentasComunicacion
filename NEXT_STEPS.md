# 📋 Instrucciones Finales - Sistema de Carrusel de Imágenes

## 🎯 Lo que ya está completado

✅ **Componente ImageCarousel** - Carrusel funcional con navegación  
✅ **CartSidebar Rediseñado** - Interfaz mejorada con estilos moderno  
✅ **Catalogo Mejorado** - Integración con carrusel y mejores filtros  
✅ **Backend Actualizado** - Endpoints devuelven imágenes relacionadas  
✅ **Schema de Prisma** - ProductoImagen modelo creado  

## ⚠️ Lo que FALTA (No se pudo completar por limitaciones de conexión)

### 1️⃣ **Migración de Base de Datos** [CRÍTICO - HACER PRIMERO]

```bash
cd backend
npm run db:push
```

**Qué hace:** Ejecuta la migración Prisma para crear la tabla `ProductoImagen` en tu base de datos.

**Indicador de éxito:** Ves un mensaje como:
```
✔ Your database is now in sync with your schema
```

---

### 2️⃣ **Agregar Imágenes a los Productos**

Después de ejecutar `db:push`, necesitas poblar la tabla con imágenes.

#### **Opción A: Usar cURL/Postman (Rápido)**

```bash
curl -X POST http://localhost:5000/api/productos/1/imagenes \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ejemplo.com/imagen1.jpg",
    "orden": 1
  }'
```

#### **Opción B: Usar SQL directo**

```sql
INSERT INTO "ProductoImagen" ("productoId", "url", "orden")
VALUES 
  (1, 'https://ejemplo.com/producto1-img1.jpg', 1),
  (1, 'https://ejemplo.com/producto1-img2.jpg', 2),
  (2, 'https://ejemplo.com/producto2-img1.jpg', 1);
```

#### **Opción C: Crear endpoint de admin** (Recomendado para producción)

Crea en `backend/src/routes/productos.ts`:

```typescript
// POST /api/productos/:id/imagenes
router.post('/:id/imagenes', upload.single('imagen'), async (req: Request, res: Response): Promise<void> => {
  try {
    const productoId = Number(req.params.id);
    const { orden } = req.body;
    const url = req.file?.filename || req.body.url;

    if (!url) {
      res.status(400).json({ error: 'URL de imagen requerida' });
      return;
    }

    const imagen = await prisma.productoImagen.create({
      data: {
        productoId,
        url,
        orden: Number(orden) || 1,
      },
    });

    res.status(201).json(imagen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar imagen' });
  }
});

// DELETE /api/productos/:id/imagenes/:imagenId
router.delete('/:id/imagenes/:imagenId', async (req: Request, res: Response): Promise<void> => {
  try {
    const imagenId = Number(req.params.imagenId);
    
    await prisma.productoImagen.delete({
      where: { id: imagenId },
    });

    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
});
```

---

### 3️⃣ **Pruebas de Integración**

#### Verificar que el API devuelve imágenes:

```bash
curl http://localhost:5000/api/productos
```

Deberías ver respuestas como:
```json
{
  "id": 1,
  "nombre": "Laptop",
  "precio": 999,
  "imagenes": [
    { "id": 1, "url": "img1.jpg", "orden": 1 },
    { "id": 2, "url": "img2.jpg", "orden": 2 }
  ]
}
```

#### Probar el carrusel en el navegador:

1. Abre http://localhost:5173/catalogo
2. Verifica que cada producto muestre el carrusel
3. Prueba navegación: botones < >
4. Prueba miniaturas (click)
5. Prueba puntos indicadores

#### Probar carrito:

1. Haz clic en un producto para agregar al carrito
2. Abre el carrito (ícono en la esquina)
3. Verifica que la imagen se muestre correctamente
4. Prueba +/- para cantidad
5. Prueba eliminar producto

---

## 🔧 Solución de Problemas

### Problema: "Faltan imágenes en el carrusel"
**Solución:** Ejecuta `npm run db:push` en backend y luego agrega imágenes usando una de las opciones arriba.

### Problema: "El carrusel no se muestra"
**Verificar:**
1. ¿Se compiló sin errores TypeScript?
2. ¿El API devuelve `imagenes[]`?
3. ¿Las URLs de las imágenes son válidas?

### Problema: "Las imágenes se cargan pero se ven pixeladas"
**Solución:** Asegúrate de que las imágenes tengan resolución suficiente (mínimo 400x400px).

---

## 📊 Arquitectura de la Solución

```
┌─────────────────────────────────────────┐
│         Frontend (React + TS)            │
├─────────────────────────────────────────┤
│  Catalogo.tsx                            │
│    ↓                                     │
│  ImageCarousel.tsx (nuevo)              │
│    ↓                                     │
│  CartSidebar.tsx (mejorado)            │
└─────────────────────────────────────────┘
            ↓ Fetch
┌─────────────────────────────────────────┐
│      Backend (Express + Prisma)         │
├─────────────────────────────────────────┤
│  GET /api/productos                     │
│    ↓ include { imagenes }               │
│  Prisma Query                           │
└─────────────────────────────────────────┘
            ↓ Query
┌─────────────────────────────────────────┐
│    Base de Datos (PostgreSQL/Supabase)  │
├─────────────────────────────────────────┤
│  Tabla: Producto                        │
│    ├─ id, nombre, precio...            │
│    └─ relation: imagenes[]              │
│                                         │
│  Tabla: ProductoImagen (NUEVA)         │
│    ├─ id, productoId, url, orden      │
│    └─ createdAt, updatedAt             │
└─────────────────────────────────────────┘
```

---

## ✨ Checklist Final

Antes de considerar esto completo:

- [ ] Ejecute `npm run db:push` en backend
- [ ] Agregue imágenes de prueba a al menos 3 productos
- [ ] Pruebe el carrusel navegando entre imágenes
- [ ] Pruebe agregar productos al carrito desde el carrusel
- [ ] Pruebe que el carrito muestre la imagen correctamente
- [ ] Verifique ordenamiento y filtros
- [ ] Pruebe en móvil (responsividad)
- [ ] Verifique que la tabla ProductoImagen existe en la base de datos

---

## 📞 Soporte Rápido

Si algo no funciona:

1. **Verifica los logs del backend:**
   ```bash
   npm start  # en backend/
   ```

2. **Verifica la consola del navegador:**
   - F12 → Console tab
   - Busca mensajes de error

3. **Verifica que la base de datos está actualizada:**
   ```bash
   npx prisma studio  # Ver datos en interfaz gráfica
   ```

---

**¡Los componentes están listos, solo necesitas completar estos pasos finales!** 🎉
