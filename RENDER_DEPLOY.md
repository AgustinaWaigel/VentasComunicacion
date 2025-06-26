# 🚀 Guía de Deployment en Render

## Pasos para deployar en Render:

### 1. Subir el código a GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Crear cuenta en Render
- Ve a [render.com](https://render.com)
- Crea una cuenta gratuita
- Conecta tu cuenta de GitHub

### 3. Crear el proyecto desde render.yaml
1. En el dashboard de Render, haz clic en "New +"
2. Selecciona "Blueprint"
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el archivo `render.yaml`
5. Haz clic en "Apply"

### 4. URLs de tu aplicación
Después del deployment, tendrás:
- **Frontend**: `https://mi-app-ventas-frontend.onrender.com`
- **Backend**: `https://mi-app-ventas-backend.onrender.com`

### 5. Verificar el deployment
- Visita la URL del frontend
- Verifica que puede conectarse al backend
- Prueba todas las funcionalidades

## 🔧 Configuración incluida:

### Variables de entorno:
- `NODE_ENV=production` (tanto frontend como backend)
- `PORT=10000` (backend)
- `VITE_API_URL=https://mi-app-ventas-backend.onrender.com` (frontend)

### CORS configurado:
El backend permite requests desde:
- `https://mi-app-ventas-frontend.onrender.com`

### Scripts de build:
- **Backend**: `cd backend && npm install && npm run build`
- **Frontend**: `npm install && npm run build`

## 📝 Notas importantes:

1. **Plan gratuito**: Los servicios gratuitos de Render se "duermen" después de 15 minutos de inactividad
2. **Primer acceso**: Puede tardar hasta 30 segundos en "despertar"
3. **Archivos persistentes**: Los archivos subidos se perderán al reiniciar (usar almacenamiento externo para producción)

## 🐛 Troubleshooting:

Si hay errores:
1. Revisa los logs en el dashboard de Render
2. Verifica que las URLs en CORS coincidan con las URLs reales
3. Asegúrate de que el `package.json` tenga todos los scripts necesarios

## 🎉 ¡Listo!

Tu aplicación de ventas estará disponible en internet con todas las mejoras implementadas:
- Interfaz moderna y responsive
- Sistema de productos y ventas
- Estadísticas y resúmenes
- Subida de imágenes
- Eventos y comunicación
