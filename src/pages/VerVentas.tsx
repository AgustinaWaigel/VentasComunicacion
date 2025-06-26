import { useEffect, useState } from "react";

interface DetalleVenta {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  subtotal: number;
  ganancia: number;
  nombre: string;
}

interface Venta {
  id: number;
  fecha: string;
  total: number;
  ganancia: number;
  detalles: DetalleVenta[];
  metodoPago?: string;
  efectivo?: number;
  debe?: boolean;
  evento_id?: number;
  evento_nombre?: string;
  evento_fecha?: string;
}

interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  descripcion?: string;
  activo: boolean;
}


export default function VerVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEvento, setFiltroEvento] = useState<string>("");
  const [ventaEditando, setVentaEditando] = useState<number | null>(null);
  
  // Filtrar ventas
  const ventasFiltradas = ventas.filter(venta => {
    const coincideNombre = venta.detalles.some(detalle =>
      detalle.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
    );
    
    const coincideEvento = filtroEvento === "" || 
      (filtroEvento === "campamento-adolescentes" && (!venta.evento_id || venta.evento_nombre === "Campamento Adolescentes 2025")) ||
      (venta.evento_id && venta.evento_id.toString() === filtroEvento);
    
    return coincideNombre && coincideEvento;
  });

  useEffect(() => {
    // Cargar ventas
    fetch(`${import.meta.env.VITE_API_URL}/api/ventas`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("VENTAS RECIBIDAS:", data);
        setVentas(data);
      })
      .catch((err) => console.error("Error al cargar ventas:", err));

    // Cargar eventos
    fetch(`${import.meta.env.VITE_API_URL}/api/eventos`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        setEventos(data);
      })
      .catch((err) => console.error("Error al cargar eventos:", err));
  }, []);

  const gananciaTotal = ventasFiltradas.reduce(
    (sum, v) => sum + v.ganancia,
    0
  );

  const totalDineroTransferencia = ventasFiltradas.reduce(
    (sum, v) => v.metodoPago?.toLowerCase() === "transferencia" ? sum + v.total : sum,
    0
  );

  const totalDineroEfectivo = ventasFiltradas.reduce(
    (sum, v) => v.metodoPago?.toLowerCase() === "efectivo" ? sum + v.total : sum,
    0
  );

  const totalDinero = ventasFiltradas.reduce(
    (sum, v) => sum + v.total,
    0
  );

  // Estadísticas por evento
  const estadisticasPorEvento = () => {
    const stats: { [key: string]: { ventas: number, ingresos: number, ganancia: number, nombre: string } } = {};
    
    ventasFiltradas.forEach(venta => {
      const key = venta.evento_id ? venta.evento_id.toString() : 'campamento-adolescentes';
      const nombre = venta.evento_nombre || 'Campamento Adolescentes 2025';
      
      if (!stats[key]) {
        stats[key] = { ventas: 0, ingresos: 0, ganancia: 0, nombre };
      }
      
      stats[key].ventas += 1;
      stats[key].ingresos += venta.total;
      stats[key].ganancia += venta.ganancia;
    });
    
    return Object.entries(stats)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.ingresos - a.ingresos);
  };

  const eliminarVenta = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta venta?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Error al eliminar la venta: ${res.statusText}`);

      setVentas((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      alert("Error al eliminar la venta. Por favor, inténtalo de nuevo.");
    }

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Historial de Ventas
            </h1>
            <p className="text-blue-100 mt-2">Analiza tus ventas, ingresos y ganancias por evento</p>
          </div>

          <div className="p-8">
            {/* Filtros */}
            <div className="mb-8 bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700">Filtros de búsqueda</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar por producto
                  </label>
                  <input
                    type="text"
                    placeholder="🔍 Escribe el nombre del producto..."
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Filtrar por evento
                  </label>
                  <select
                    value={filtroEvento}
                    onChange={(e) => setFiltroEvento(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                  >
                    <option value="">📋 Todos los eventos</option>
                    <option value="campamento-adolescentes">🏕️ Campamento Adolescentes 2025</option>
                    {eventos.map((evento) => (
                      <option key={evento.id} value={evento.id.toString()}>
                        📅 {evento.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Estadísticas generales */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700">Estadísticas generales</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-blue-800 mb-1">Total Ventas</h3>
                  <p className="text-3xl font-bold text-blue-600">{ventasFiltradas.length}</p>
                  <p className="text-sm text-blue-700 mt-1">Transacciones realizadas</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-green-800 mb-1">Ingresos Totales</h3>
                  <p className="text-3xl font-bold text-green-600">${totalDinero.toLocaleString()}</p>
                  <p className="text-sm text-green-700 mt-1">Revenue generado</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-purple-800 mb-1">Ganancia Total</h3>
                  <p className="text-3xl font-bold text-purple-600">${gananciaTotal.toLocaleString()}</p>
                  <p className="text-sm text-purple-700 mt-1">Beneficio neto</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-orange-800 mb-1">Métodos de Pago</h3>
                  <p className="text-xl font-bold text-orange-600">${totalDineroEfectivo.toLocaleString()}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-orange-700">💵 Efectivo</span>
                    <span className="text-xs text-orange-700">💳 ${totalDineroTransferencia.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas por evento */}
            {estadisticasPorEvento().length > 1 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700">Estadísticas por Evento</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {estadisticasPorEvento().map((stat) => (
                    <div key={stat.key} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-lg">{stat.nombre}</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Ventas
                          </span>
                          <span className="font-bold text-blue-800">{stat.ventas}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-green-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Ingresos
                          </span>
                          <span className="font-bold text-green-800">${stat.ingresos.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium text-purple-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Ganancia
                          </span>
                          <span className="font-bold text-purple-800">${stat.ganancia.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Ventas */}
            {ventasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6" />
                </svg>
                <p className="text-gray-500 text-lg">No hay ventas que coincidan con el filtro</p>
                <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700">Registro de Ventas</h3>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {ventasFiltradas.length} {ventasFiltradas.length === 1 ? 'venta' : 'ventas'}
                  </span>
                </div>

                <div className="space-y-4">
                  {ventasFiltradas.map((v, index) => (
                    <div key={v.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Información principal */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                #{ventasFiltradas.length - index}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {new Date(v.fecha).toLocaleDateString("es-AR", {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(v.fecha).toLocaleTimeString("es-AR", {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Badge del evento */}
                            <div>
                              {v.evento_nombre && v.evento_nombre !== "Campamento Adolescentes 2025" ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  📅 {v.evento_nombre}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  🏕️ Campamento Adolescentes 2025
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Productos */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Productos vendidos
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <ul className="space-y-2">
                                {v.detalles.map((d) => (
                                  <li key={d.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">
                                      <strong>{d.nombre}</strong> × {d.cantidad}
                                    </span>
                                    <span className="font-semibold text-green-600">
                                      ${d.subtotal.toFixed(2)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Información financiera y acciones */}
                        <div className="lg:w-80">
                          <div className="grid grid-cols-1 gap-4 mb-6">
                            {/* Total */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-green-700">Total</span>
                                {ventaEditando === v.id ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={v.total}
                                    onChange={(e) => {
                                      const nuevoTotal = parseFloat(e.target.value);
                                      setVentas(prev =>
                                        prev.map(venta => venta.id === v.id ? { ...venta, total: nuevoTotal } : venta)
                                      );
                                    }}
                                    className="border-2 border-green-300 rounded-lg px-3 py-1 w-24 text-right font-bold text-green-600 focus:ring-2 focus:ring-green-200"
                                  />
                                ) : (
                                  <span className="text-xl font-bold text-green-600">${v.total.toFixed(2)}</span>
                                )}
                              </div>
                            </div>

                            {/* Ganancia */}
                            <div className="bg-gradient-to-r from-purple-50 to-purple-50 rounded-xl p-4 border border-purple-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-purple-700">Ganancia</span>
                                {ventaEditando === v.id ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={v.ganancia}
                                    onChange={(e) => {
                                      const nuevaGanancia = parseFloat(e.target.value);
                                      setVentas(prev =>
                                        prev.map(venta => venta.id === v.id ? { ...venta, ganancia: nuevaGanancia } : venta)
                                      );
                                    }}
                                    className="border-2 border-purple-300 rounded-lg px-3 py-1 w-24 text-right font-bold text-purple-600 focus:ring-2 focus:ring-purple-200"
                                  />
                                ) : (
                                  <span className="text-xl font-bold text-purple-600">${v.ganancia.toFixed(2)}</span>
                                )}
                              </div>
                            </div>

                            {/* Método de pago */}
                            <div className="bg-gradient-to-r from-orange-50 to-orange-50 rounded-xl p-4 border border-orange-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-orange-700">Método</span>
                                {ventaEditando === v.id ? (
                                  <select
                                    value={v.metodoPago}
                                    onChange={(e) =>
                                      setVentas(prev =>
                                        prev.map(venta =>
                                          venta.id === v.id ? { ...venta, metodoPago: e.target.value } : venta
                                        )
                                      )
                                    }
                                    className="border-2 border-orange-300 rounded-lg px-3 py-1 font-medium text-orange-600 focus:ring-2 focus:ring-orange-200"
                                  >
                                    <option value="efectivo">💵 Efectivo</option>
                                    <option value="transferencia">💳 Transferencia</option>
                                  </select>
                                ) : (
                                  <span className="font-semibold text-orange-600">
                                    {v.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex gap-3">
                            {ventaEditando === v.id ? (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${v.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          total: v.total,
                                          ganancia: v.ganancia,
                                          metodoPago: v.metodoPago
                                        })
                                      });

                                      if (!res.ok) {
                                        throw new Error(`Error al actualizar la venta: ${res.statusText}`);
                                      }

                                      alert("✅ Venta actualizada correctamente");
                                      setVentaEditando(null);
                                    } catch (err) {
                                      console.error(err);
                                      alert("❌ Hubo un error al guardar los cambios");
                                    }
                                  }}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl px-4 py-2 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setVentaEditando(null)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white rounded-xl px-4 py-2 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setVentaEditando(v.id)}
                                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-2 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={() => eliminarVenta(v.id)}
                                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl px-4 py-2 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen final mejorado */}
            {ventasFiltradas.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Resumen financiero
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Ganancia Total</p>
                    <p className="text-xl font-bold text-purple-600">${gananciaTotal.toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
                    <p className="text-xl font-bold text-green-600">${totalDinero.toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Efectivo</p>
                    <p className="text-xl font-bold text-orange-600">${totalDineroEfectivo.toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Transferencias</p>
                    <p className="text-xl font-bold text-blue-600">${totalDineroTransferencia.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
