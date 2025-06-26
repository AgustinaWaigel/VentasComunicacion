#!/bin/bash

echo "🚀 Iniciando aplicación de ventas en modo desarrollo..."

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -f "node.*5000" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org/"
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Crear carpetas necesarias
mkdir -p uploads data dist

# Iniciar backend en segundo plano
echo "🔧 Iniciando backend en puerto 5000..."
npm run dev &
BACKEND_PID=$!

cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# Esperar un poco para que el backend se inicie
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend en puerto 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Aplicación iniciada exitosamente!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Para detener la aplicación, presiona Ctrl+C"

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo aplicación..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Capturar señal de interrupción
trap cleanup INT

# Mantener el script corriendo
wait
