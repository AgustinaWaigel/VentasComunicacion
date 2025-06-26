@echo off
echo 🚀 Iniciando aplicación de ventas en modo desarrollo...

:: Limpiar procesos anteriores
echo 🧹 Limpiando procesos anteriores...
taskkill /f /im node.exe 2>nul >nul

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version

:: Instalar dependencias del backend
echo 📦 Instalando dependencias del backend...
cd backend
if not exist "node_modules" (
    npm install
)

:: Crear carpetas necesarias
if not exist "uploads" mkdir uploads
if not exist "data" mkdir data
if not exist "dist" mkdir dist

:: Iniciar backend
echo 🔧 Iniciando backend en puerto 5000...
start "Backend" cmd /c "npm run dev"

cd ..

:: Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
if not exist "node_modules" (
    npm install
)

:: Esperar un poco para que el backend se inicie
timeout /t 3 /nobreak >nul

:: Iniciar frontend
echo 🎨 Iniciando frontend en puerto 5173...
start "Frontend" cmd /c "npm run dev"

echo.
echo 🎉 Aplicación iniciada exitosamente!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:5000
echo.
echo Para detener la aplicación, cierra las ventanas de terminal que se abrieron.
pause
