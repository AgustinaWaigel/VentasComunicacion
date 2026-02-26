# Instrucciones para deployment

## Para Vercel
1. Conecta tu repositorio de GitHub con Vercel
2. Variables de entorno en Vercel:
   - VITE_API_URL: https://tu-backend-url.com

## Para Netlify
1. Conecta tu repositorio de GitHub con Netlify
2. Build command: npm run build
3. Publish directory: dist
4. Variables de entorno en Netlify:
   - VITE_API_URL: https://tu-backend-url.com

## Para Railway
1. Conecta tu repositorio de GitHub con Railway
2. Variables de entorno:
   - VITE_API_URL: https://tu-backend-url.com

## Build local para testing
npm run build:prod
npm run serve
