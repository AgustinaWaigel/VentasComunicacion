import { useState } from "react";

export default function AgregarProducto() {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState<string>("");
  const [costo, setCosto] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // Calcular ganancia automáticamente
  const calcularGanancia = () => {
    const precioNum = parseFloat(precio) || 0;
    const costoNum = parseFloat(costo) || 0;
    const ganancia = precioNum - costoNum;
    const porcentaje = costoNum > 0 ? ((ganancia / costoNum) * 100) : 0;
    return { ganancia, porcentaje };
  };

  const { ganancia, porcentaje } = calcularGanancia();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    // Validaciones
    if (!nombre.trim()) {
      setMensaje("❌ El nombre del producto es obligatorio");
      setCargando(false);
      return;
    }

    const precioNum = parseFloat(precio);
    const costoNum = parseFloat(costo);
    const stockNum = parseInt(stock);

    if (isNaN(precioNum) || precioNum < 0) {
      setMensaje("❌ El precio debe ser un número válido");
      setCargando(false);
      return;
    }

    if (isNaN(costoNum) || costoNum < 0) {
      setMensaje("❌ El costo debe ser un número válido");
      setCargando(false);
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setMensaje("❌ El stock debe ser un número válido");
      setCargando(false);
      return;
    }

    if (costoNum > precioNum) {
      setMensaje("⚠️ El costo es mayor que el precio de venta. ¿Estás seguro?");
    }

    const formData = new FormData();
    formData.append("nombre", nombre.trim());
    formData.append("categoria", categoria.trim());
    formData.append("precio", precioNum.toString());
    formData.append("costo", costoNum.toString());
    formData.append("stock", stockNum.toString());
    if (imagen) {
      formData.append("imagen", imagen);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMensaje("✅ Producto agregado correctamente");
        // Limpiar formulario
        setNombre("");
        setCategoria("");
        setPrecio("");
        setCosto("");
        setStock("");
        setImagen(null);
        setPreview("");
        
        // Enfocar el primer campo para facilitar agregar otro producto
        setTimeout(() => {
          const nombreInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (nombreInput) nombreInput.focus();
        }, 100);
      } else {
        const errorData = await res.text();
        setMensaje(`❌ Error al agregar el producto: ${errorData}`);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con el servidor");
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMensaje("❌ La imagen debe ser menor a 5MB");
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMensaje("❌ Solo se permiten archivos de imagen");
        return;
      }

      setImagen(file);
      setPreview(URL.createObjectURL(file));
      setMensaje("");
    }
  };

  const eliminarImagen = () => {
    setImagen(null);
    setPreview("");
    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const categoriasSugeridas = [
    "Stickers",
    "Accesorios",
    "Decoración",
    "Llaveros",
    "Otros"
  ];

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Agregar Nuevo Producto</h1>
          <p className="text-blue-100 mt-2">Completa la información del producto que quieres agregar al inventario</p>
        </div>

        <div className="p-6">
          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`mb-6 p-4 rounded-lg border ${
              mensaje.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : mensaje.includes('⚠️')
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {mensaje.includes('✅') && <span className="text-xl">✅</span>}
                  {mensaje.includes('⚠️') && <span className="text-xl">⚠️</span>}
                  {mensaje.includes('❌') && <span className="text-xl">❌</span>}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{mensaje}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Producto</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Sticker IAM LOGO"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={cargando}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Selecciona o escribe una categoría"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      list="categorias"
                      disabled={cargando}
                    />
                    <datalist id="categorias">
                      {categoriasSugeridas.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Precios y stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio de venta * 
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        placeholder="100"
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        disabled={cargando}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo del producto *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        placeholder="60"
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        value={costo}
                        onChange={(e) => setCosto(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        disabled={cargando}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock inicial *
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    min="0"
                    disabled={cargando}
                  />
                </div>

                {/* Cálculo de ganancia */}
                {(precio || costo) && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cálculo de Ganancia</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ganancia por unidad:</span>
                        <p className={`font-semibold ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${ganancia.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Margen de ganancia:</span>
                        <p className={`font-semibold ${porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {porcentaje.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Imagen */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Imagen del Producto</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir imagen
                  </label>
                  
                  {!preview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 text-gray-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                          </svg>
                        </div>
                        <div>
                          <label htmlFor="imagen" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 font-medium">
                              Subir una imagen
                            </span>
                            <input
                              id="imagen"
                              type="file"
                              accept="image/*"
                              onChange={handleImagenChange}
                              className="hidden"
                              disabled={cargando}
                            />
                          </label>
                          <p className="text-gray-500">o arrastra y suelta</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF hasta 5MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={preview} 
                        alt="Previsualización" 
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={eliminarImagen}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        disabled={cargando}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="mt-2 text-center">
                        <label htmlFor="imagen-change" className="cursor-pointer text-blue-600 hover:text-blue-500 text-sm font-medium">
                          Cambiar imagen
                          <input
                            id="imagen-change"
                            type="file"
                            accept="image/*"
                            onChange={handleImagenChange}
                            className="hidden"
                            disabled={cargando}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {cargando ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  "Guardar Producto"
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setNombre("");
                  setCategoria("");
                  setPrecio("");
                  setCosto("");
                  setStock("");
                  eliminarImagen();
                  setMensaje("");
                }}
                disabled={cargando}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
