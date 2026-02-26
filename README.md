# 🏪 Sistema de Ventas y Comunicación

Una aplicación web moderna para gestión de ventas, productos y eventos, construida con React, TypeScript, Node.js y Express.

## ✨ Características

- 📦 **Gestión de Productos**: Agregar, editar y visualizar productos con imágenes
- 💰 **Sistema de Ventas**: Registro y seguimiento de ventas con resúmenes financieros
- 📊 **Estadísticas**: Dashboard con métricas de ventas y productos
- 🎯 **Eventos**: Sistema de comunicación y eventos
- 📱 **Responsive**: Interfaz moderna que funciona en móviles y escritorio
- 🎨 **UI Moderna**: Diseño con Tailwind CSS y componentes interactivos

## 🚀 Tecnologías

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

### Backend
- Node.js + Express
- TypeScript
- CORS configurado
- Multer para subida de archivos
- Excel.js para manejo de datos

## 🛠️ Configuración Local

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd mi-app-ventas
```

### 2. Configurar variables de entorno
```bash
# Copiar archivos de ejemplo
cp .env.development.example .env.development
cp .env.production.example .env.production

# Editar con tus valores
# .env.development -> VITE_API_URL=http://localhost:5000
# .env.production -> VITE_API_URL=https://tu-backend.onrender.com
```

### 3. Instalar dependencias
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 4. Ejecutar en desarrollo
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🌐 Deployment en Render

Este proyecto está configurado para deployarse fácilmente en Render usando el archivo `render.yaml`.

### Pasos rápidos:
1. Subir código a GitHub
2. Crear cuenta en [Render.com](https://render.com)
3. Crear nuevo "Blueprint"
4. Conectar repositorio
5. ¡Listo! URLs automáticas:
   - Frontend: `https://ventasiam-frontend.onrender.com`
   - Backend: `https://ventasiam-backend.onrender.com`

Ver `RENDER_DEPLOY.md` para instrucciones detalladas.

## 📂 Estructura del Proyecto

```
mi-app-ventas/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas principales
│   └── types/             # Tipos TypeScript
├── backend/               # API Node.js/Express
│   ├── src/               # Código fuente backend
│   ├── data/              # Archivos Excel de datos
│   └── uploads/           # Imágenes subidas
├── public/                # Archivos estáticos
└── render.yaml           # Configuración deployment
```

## 🔧 Scripts Disponibles

### Frontend
- `npm run dev` - Desarrollo local
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linting del código

### Backend
- `npm run dev` - Desarrollo con nodemon
- `npm run build` - Compilar TypeScript
- `npm run start` - Ejecutar producción

## 🎯 Funcionalidades Principales

### Productos
- ✅ Agregar productos con imagen y detalles
- ✅ Editar productos existentes
- ✅ Vista en tarjetas modernas
- ✅ Validaciones de formulario

### Ventas
- ✅ Registro de ventas por productos
- ✅ Resumen financiero automático
- ✅ Estadísticas por período
- ✅ Edición inline de ventas
- ✅ Filtros por fecha

### Interfaz
- ✅ Navbar responsive con menú móvil
- ✅ Diseño moderno con Tailwind
- ✅ Iconos con Lucide React
- ✅ Modales y componentes interactivos
- ✅ Estados de carga y errores

## 🔐 Seguridad

- Variables de entorno no incluidas en el repositorio
- CORS configurado para dominios específicos
- Validaciones en frontend y backend
- Archivos `.env.example` como plantillas

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Escritorio (1024px+)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 🚀 React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
