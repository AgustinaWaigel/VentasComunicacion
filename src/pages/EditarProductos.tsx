import { useEffect, useState } from "react";

interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number;
  stock: number;
  imagen?: string;
}

export default function EditarProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [imagenNueva, setImagenNueva] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/productos`)
      .then((res) => res.json())
      .then(setProductos)
      .catch(() => setMensaje("❌ Error al cargar productos"));
  }, []);

  const actualizarCampo = (id: number, campo: keyof Producto, valor: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const guardarProducto = (producto: Producto) => {
    const formData = new FormData();
    formData.append("precio", producto.precio.toString());
    formData.append("costo", producto.costo.toString());
    formData.append("stock", producto.stock.toString());

    if (imagenNueva) {
      formData.append("imagen", imagenNueva);
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/productos/${producto.id}`, {
      method: "PUT",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setProductos((prev) =>
          prev.map((p) =>
            p.id === producto.id ? { ...p, ...data } : p
          )
        );
        setMensaje("✅ Cambios guardados");
        setEditandoId(null);
        setImagenNueva(null);
      })
      .catch(() => setMensaje("❌ Error al guardar"));
  };

  const eliminarProducto = (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/productos/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          setProductos((prev) => prev.filter((p) => p.id !== id));
          setMensaje("✅ Producto eliminado");
        } else {
          setMensaje("❌ Error al eliminar");
        }
      })
      .catch(() => setMensaje("❌ Error de red"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Gestión de productos
            </h1>
            <p className="text-blue-100 mt-2">Edita precios, costos, stock e imágenes de tus productos</p>
          </div>

          <div className="p-8">
            {mensaje && (
              <div className={`mb-6 p-4 rounded-lg border-l-4 transition-all duration-300 ${
                mensaje.startsWith("✅") 
                  ? "bg-green-50 border-green-400 text-green-800" 
                  : "bg-red-50 border-red-400 text-red-800"
              }`}>
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {mensaje.startsWith("✅") ? "✅" : "⚠️"}
                  </span>
                  <p className="font-medium">{mensaje.replace(/^[✅❌]\s*/, "")}</p>
                </div>
              </div>
            )}

            {productos.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 text-lg">No hay productos para editar</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {productos.map((p) => (
                  <div key={p.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 mx-auto lg:mx-0">
                          {p.imagen ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL}/uploads/${p.imagen}`}
                              alt={p.nombre}
                              className="w-full h-full object-cover rounded-2xl border-2 border-gray-200 shadow-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          {editandoId === p.id && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cambiar imagen
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                                onChange={(e) => setImagenNueva(e.target.files?.[0] || null)}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{p.nombre}</h3>
                          {p.categoria && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {p.categoria}
                            </span>
                          )}
                        </div>

                        {/* Campos editables */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Precio */}
                          <div className="bg-white rounded-xl p-4 border-2 border-green-100">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Precio de venta
                            </label>
                            {editandoId === p.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={p.precio}
                                onChange={(e) => actualizarCampo(p.id, 'precio', Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                placeholder="0.00"
                              />
                            ) : (
                              <p className="text-2xl font-bold text-green-600">${p.precio.toFixed(2)}</p>
                            )}
                          </div>

                          {/* Costo */}
                          <div className="bg-white rounded-xl p-4 border-2 border-orange-100">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Costo
                            </label>
                            {editandoId === p.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={p.costo}
                                onChange={(e) => actualizarCampo(p.id, 'costo', Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                                placeholder="0.00"
                              />
                            ) : (
                              <p className="text-2xl font-bold text-orange-600">${p.costo.toFixed(2)}</p>
                            )}
                          </div>

                          {/* Stock */}
                          <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Stock disponible
                            </label>
                            {editandoId === p.id ? (
                              <input
                                type="number"
                                value={p.stock}
                                onChange={(e) => actualizarCampo(p.id, 'stock', Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                placeholder="0"
                              />
                            ) : (
                              <p className="text-2xl font-bold text-blue-600">{p.stock}</p>
                            )}
                          </div>
                        </div>

                        {/* Ganancia calculada */}
                        {!editandoId || editandoId !== p.id ? (
                          <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Ganancia por unidad:
                              </span>
                              <span className="font-bold text-purple-700">
                                ${(p.precio - p.costo).toFixed(2)} ({(((p.precio - p.costo) / p.precio) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex-shrink-0 flex flex-col gap-3 lg:w-32">
                        {editandoId === p.id ? (
                          <>
                            <button
                              onClick={() => guardarProducto(p)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl px-4 py-3 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditandoId(null);
                                setImagenNueva(null);
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white rounded-xl px-4 py-3 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditandoId(p.id)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => eliminarProducto(p.id)}
                              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl px-4 py-3 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
