import { useEffect, useState } from "react";
import ModalResumenVenta from "../components/ModalResumenVenta";

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    costo: number;
    stock: number;
    imagen?: string;
}

interface Evento {
    id: number;
    nombre: string;
    fecha: string;
    descripcion?: string;
    activo: boolean;
}

export interface ItemCarrito {
    producto_id: number;
    nombre: string;
    cantidad: number;
    subtotal: number;
    ganancia: number;
}

export default function AgregarVentas() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [eventoSeleccionado, setEventoSeleccionado] = useState<number | "">("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<number | "">("");
    const [cantidad, setCantidad] = useState<number>(1);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [mensaje, setMensaje] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [mostrarOpciones, setMostrarOpciones] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [efectivo, setEfectivo] = useState<number>(0);

    const [metodoPago, setMetodoPago] = useState<"efectivo" | "transferencia">("efectivo");
    const [debe, setDebe] = useState(false);

    useEffect(() => {
        // Cargar productos
        fetch(`${import.meta.env.VITE_API_URL}/api/productos`)
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Error HTTP ${res.status}: ${text}`);
                }
                return res.json();
            })
            .then((data) => {
                setProductos(data);
            })
            .catch((err) => {
                console.error("❌ Error al obtener productos:", err.message);
            });

        // Cargar eventos activos
        fetch(`${import.meta.env.VITE_API_URL}/api/eventos`)
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Error HTTP ${res.status}: ${text}`);
                }
                return res.json();
            })
            .then((data) => {
                // Filtrar solo eventos activos y ordenar por ID (más reciente primero)
                const eventosActivos = data
                    .filter((evento: Evento) => evento.activo)
                    .sort((a: Evento, b: Evento) => b.id - a.id);
                
                setEventos(eventosActivos);
                
                // Seleccionar automáticamente el último evento creado (el primero de la lista ordenada)
                if (eventosActivos.length > 0) {
                    setEventoSeleccionado(eventosActivos[0].id);
                }
            })
            .catch((err) => {
                console.error("❌ Error al obtener eventos:", err.message);
            });
    }, []);

    const actualizarCantidad = (index: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;

        setCarrito((prev) => {
            const copia = [...prev];
            const item = copia[index];
            const producto = productos.find(p => p.id === item.producto_id);

            if (!producto || nuevaCantidad > producto.stock) {
                setMensaje("❌ Cantidad inválida o sin stock");
                return prev;
            }

            const nuevoSubtotal = (item.subtotal / item.cantidad) * nuevaCantidad;
            const nuevaGanancia = (item.ganancia / item.cantidad) * nuevaCantidad;

            copia[index] = {
                ...item,
                cantidad: nuevaCantidad,
                subtotal: nuevoSubtotal,
                ganancia: nuevaGanancia,
            };

            setMensaje("");
            return copia;
        });
    };

    const agregarAlCarrito = () => {
        const producto = productos.find((p) => p.id === Number(productoSeleccionado));
        if (!producto) return;

        if (producto.precio <= 0) {
            setMensaje(`❌ El producto "${producto.nombre}" no tiene precio válido`);
            return;
        }

        if (producto.stock <= 0) {
            setMensaje(`❌ El producto "${producto.nombre}" no tiene stock`);
            return;
        }

        if (cantidad <= 0 || cantidad > producto.stock) {
            setMensaje("❌ Cantidad inválida");
            return;
        }

        const subtotal = producto.precio * cantidad;
        const ganancia = (producto.precio - producto.costo) * cantidad;

        setCarrito((prev) => [
            ...prev,
            {
                producto_id: producto.id,
                nombre: producto.nombre,
                cantidad,
                subtotal,
                ganancia,
            },
        ]);

        setCantidad(1);
        setProductoSeleccionado("");
        setBusqueda("");
        setMensaje("");
        setMostrarOpciones(false);
    };

    const eliminarItem = (index: number) => {
        setCarrito(carrito.filter((_, i) => i !== index));
    };

    const total = carrito.reduce((sum, i) => sum + i.subtotal, 0);
    const ganancia = carrito.reduce((sum, i) => sum + i.ganancia, 0);

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M7 13l-1.5-9m0 0h2m13 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                            </svg>
                            Registrar nueva venta
                        </h1>
                        <p className="text-blue-100 mt-2">Gestiona tus ventas de manera rápida y eficiente</p>
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

                        {/* Selector de Evento */}
                        <div className="mb-8 bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <label className="text-lg font-semibold text-gray-700">
                                    Evento
                                </label>
                            </div>
                            <select
                                value={eventoSeleccionado}
                                onChange={(e) => setEventoSeleccionado(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                            >
                                <option value="">🏕️ Campamento Adolescentes 2025 (General)</option>
                                {eventos.map((evento) => (
                                    <option key={evento.id} value={evento.id}>
                                        📅 {evento.nombre} - {new Date(evento.fecha).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                            {eventos.length === 0 && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-700">
                                        💡 No hay eventos específicos. 
                                        <a href="/eventos" className="font-semibold text-blue-600 hover:text-blue-800 ml-1 underline">
                                            Crear uno aquí
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Búsqueda de Productos */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-700">Buscar producto</h3>
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Escribe el nombre del producto..."
                                    value={busqueda}
                                    onChange={(e) => {
                                        setBusqueda(e.target.value);
                                        setProductoSeleccionado("");
                                        setMostrarOpciones(true);
                                    }}
                                    onFocus={() => setMostrarOpciones(true)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                                />

                                {busqueda && (
                                    <button
                                        onClick={() => {
                                            setBusqueda("");
                                            setProductoSeleccionado("");
                                            setMostrarOpciones(true);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
                                        title="Borrar búsqueda"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                {mostrarOpciones && (busqueda.trim() !== "" || productoSeleccionado === "") && (
                                    <div className="absolute mt-2 w-full border-2 border-gray-100 rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto z-20">
                                        {productosFiltrados.length > 0 ? (
                                            <ul className="divide-y divide-gray-100">
                                                {productosFiltrados.map((p) => (
                                                    <li
                                                        key={p.id}
                                                        onClick={() => {
                                                            setProductoSeleccionado(p.id);
                                                            setBusqueda(p.nombre);
                                                            setMostrarOpciones(false);
                                                        }}
                                                        className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 flex items-center gap-4 transition-all duration-200"
                                                    >
                                                        {p.imagen ? (
                                                            <img
                                                                src={`${import.meta.env.VITE_API_URL}/uploads/${p.imagen}`}
                                                                alt={p.nombre}
                                                                className="w-12 h-12 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-800">{p.nombre}</p>
                                                            <p className="text-green-600 font-bold">${p.precio}</p>
                                                        </div>
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="p-6 text-center text-gray-500">
                                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.464-.881-6.08-2.33l-.84.72a9 9 0 1313.82 0l-.84-.72z" />
                                                </svg>
                                                <p>No se encontraron productos</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selector de Cantidad */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-700">Cantidad</h3>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 w-fit">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    −
                                </button>

                                <div className="bg-white border-2 border-gray-200 rounded-xl px-6 py-2 min-w-[80px] text-center">
                                    <span className="text-2xl font-bold text-gray-800">{cantidad}</span>
                                </div>

                                <button
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Detalles del Producto Seleccionado */}
                        {productoSeleccionado !== "" && (() => {
                            const producto = productos.find(p => p.id === Number(productoSeleccionado));
                            if (!producto) return null;

                            return (
                                <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            Producto seleccionado
                                        </h3>
                                    </div>

                                    <div className="flex items-start gap-6">
                                        {producto.imagen ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/uploads/${producto.imagen}`}
                                                alt={producto.nombre}
                                                className="w-24 h-24 object-cover rounded-2xl border-2 border-white shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg">
                                                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-gray-800 mb-2">
                                                {producto.nombre}
                                            </h4>
                                            
                                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                                <p className="text-sm text-gray-600 mb-1">Precio unitario</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {producto.precio > 0 ? (
                                                        `$${producto.precio}`
                                                    ) : (
                                                        <span className="text-red-500 text-lg">Sin precio definido</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Botón Agregar al Carrito */}
                        <div className="mb-8">
                            <button
                                onClick={agregarAlCarrito}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-8 py-4 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M7 13l-1.5-9m0 0h2m13 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                                </svg>
                                Agregar al carrito
                            </button>
                        </div>

                        {/* Carrito de Compras */}
                        {carrito.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-700">Carrito de compras</h3>
                                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {carrito.length} {carrito.length === 1 ? 'artículo' : 'artículos'}
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    {carrito.map((item, i) => (
                                        <div key={i} className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                                                        {item.cantidad}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-800 mb-1">{item.nombre}</h4>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span>Unitario: <span className="font-semibold text-green-600">${(item.subtotal / item.cantidad).toFixed(2)}</span></span>
                                                            <span>•</span>
                                                            <span>Total: <span className="font-semibold text-green-600">${item.subtotal.toFixed(2)}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={item.cantidad}
                                                        onChange={(e) => actualizarCantidad(i, Number(e.target.value))}
                                                        className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-center font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                                        title="Modificar cantidad"
                                                    />
                                                    <button
                                                        onClick={() => eliminarItem(i)}
                                                        className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                                                        title="Eliminar del carrito"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumen de Totales */}
                        {carrito.length > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100 mb-8">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">Total de la venta</h3>
                                            <p className="text-green-600 font-semibold">Ganancia estimada: ${ganancia.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-green-600">${total.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600">{carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botón Confirmar Venta */}
                        <button
                            onClick={() => setMostrarModal(true)}
                            disabled={carrito.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3 ${
                                carrito.length > 0 
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-xl transform hover:-translate-y-1' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {carrito.length > 0 ? 'Confirmar venta' : 'Agrega productos al carrito'}
                        </button>

                        {/* Modal de Resumen de Venta */}
                        <ModalResumenVenta
                            mostrar={mostrarModal}
                            carrito={carrito}
                            total={total}
                            efectivo={efectivo}
                            setEfectivo={setEfectivo}
                            onClose={() => setMostrarModal(false)}
                            onConfirm={async () => {
                                const ventaData: any = {
                                    items: carrito,
                                    total,
                                    metodoPago,
                                    efectivo,
                                    debe
                                };

                                // Agregar evento_id solo si se seleccionó un evento
                                if (eventoSeleccionado !== "") {
                                    ventaData.evento_id = eventoSeleccionado;
                                }

                                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(ventaData),
                                });

                                if (res.ok) {
                                    setMensaje("✅ Venta registrada correctamente");
                                    setCarrito([]);
                                    setEfectivo(0);
                                    // Mantener el evento seleccionado por defecto (el último agregado)
                                    // Solo reseteamos si no hay eventos o si queremos cambiar el comportamiento
                                    setMostrarModal(false);
                                } else {
                                    setMensaje("❌ Error al registrar la venta");
                                }
                            }}
                            metodoPago={metodoPago}
                            setMetodoPago={setMetodoPago}
                            debe={debe}
                            setDebe={setDebe}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
