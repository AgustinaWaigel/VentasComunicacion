import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Truck, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

interface Venta {
  id: number;
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string | null;
  tipoEntrega: string;
  total: number;
  estado: string;
  fecha: string;
  detalles: Array<{
    id: number;
    cantidad: number;
    producto: {
      nombre: string;
    };
  }>;
}

const estadoConfig = {
  pendiente_pago: {
    color: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    icon: Clock,
    label: 'Pendiente de Pago',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  preparando: {
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-800',
    icon: Loader2,
    label: 'Preparando',
    badge: 'bg-blue-100 text-blue-800',
  },
  listo: {
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    icon: CheckCircle2,
    label: 'Listo',
    badge: 'bg-green-100 text-green-800',
  },
  entregado: {
    color: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-800',
    icon: Truck,
    label: 'Entregado',
    badge: 'bg-gray-100 text-gray-800',
  },
};

export default function Pedidos() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchVentas();
    // Polling cada 5 segundos para actualizaciones en tiempo real
    const interval = setInterval(fetchVentas, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ventas`);
      if (!response.ok) throw new Error('Error al cargar ventas');
      const data = await response.json();
      
      // Ordenar por fecha descendente y filtrar solo pedidos web (con clienteNombre)
      const ventasWeb = data
        .filter((v: Venta) => v.clienteNombre)
        .sort((a: Venta, b: Venta) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setVentas(ventasWeb);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEstado = async (ventaId: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ventas/${ventaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: nuevoEstado,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar estado');
      
      // Actualizar estado local
      setVentas(ventas.map(v => 
        v.id === ventaId ? { ...v, estado: nuevoEstado } : v
      ));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
    }
  };

  const ventasFiltradas = filtro === 'todos' 
    ? ventas 
    : ventas.filter(v => v.estado === filtro);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pedidos Web
          </h1>
          <p className="text-gray-600">
            Gestiona los pedidos realizados a través de la plataforma web
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">Total de Pedidos</div>
            <div className="text-3xl font-bold text-gray-900">{ventas.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="text-yellow-800 text-sm font-medium mb-2">Pendiente de Pago</div>
            <div className="text-3xl font-bold text-yellow-900">
              {ventas.filter(v => v.estado === 'pendiente_pago').length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-blue-800 text-sm font-medium mb-2">Preparando</div>
            <div className="text-3xl font-bold text-blue-900">
              {ventas.filter(v => v.estado === 'preparando').length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="text-green-800 text-sm font-medium mb-2">Listo</div>
            <div className="text-3xl font-bold text-green-900">
              {ventas.filter(v => v.estado === 'listo').length}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['todos', 'pendiente_pago', 'preparando', 'listo', 'entregado'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === estado
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {estado === 'todos' ? 'Todos' : estadoConfig[estado as keyof typeof estadoConfig]?.label || estado}
            </button>
          ))}
        </div>

        {/* Pedidos List */}
        {ventasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-600">No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ventasFiltradas.map((venta) => {
              const config = estadoConfig[venta.estado as keyof typeof estadoConfig] || estadoConfig.pendiente_pago;
              const IconComponent = config.icon;
              const isExpanded = expandedId === venta.id;

              return (
                <div 
                  key={venta.id} 
                  className={`border-2 rounded-lg transition-all ${config.color}`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : venta.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-white/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                        <h3 className={`text-lg font-bold ${config.textColor}`}>
                          Pedido #{venta.id}
                        </h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className={`text-sm ${config.textColor}`}>
                        <p className="font-medium">{venta.clienteNombre}</p>
                        <p>{venta.clienteTelefono}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${config.textColor}`}>
                        ${venta.total.toFixed(2)}
                      </div>
                      <div className={`text-xs ${config.textColor}`}>
                        {new Date(venta.fecha).toLocaleDateString('es-AR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className={`border-t-2 p-4 bg-white/30`}>
                      {/* Productos */}
                      <div className="mb-6">
                        <h4 className={`font-bold mb-3 ${config.textColor}`}>Productos</h4>
                        <div className="space-y-2">
                          {venta.detalles.map(detalle => (
                            <div key={detalle.id} className="flex justify-between items-center text-sm">
                              <span className={config.textColor}>
                                {detalle.cantidad}x {detalle.producto.nombre}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Información de entrega */}
                      <div className="mb-6 pb-6 border-b">
                        <h4 className={`font-bold mb-3 ${config.textColor}`}>Información de Entrega</h4>
                        <div className="text-sm space-y-2">
                          <div>
                            <span className="font-semibold">Tipo:</span> {
                              venta.tipoEntrega === 'retiro' ? 'Retiro en el local' : 'Envío a domicilio'
                            }
                          </div>
                          {venta.clienteDireccion && (
                            <div>
                              <span className="font-semibold">Dirección:</span> {venta.clienteDireccion}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      {venta.estado !== 'entregado' && (
                        <div className="flex gap-2">
                          {venta.estado === 'pendiente_pago' && (
                            <button
                              onClick={() => handleChangeEstado(venta.id, 'preparando')}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                              Marcar como Preparando
                            </button>
                          )}
                          {venta.estado === 'preparando' && (
                            <button
                              onClick={() => handleChangeEstado(venta.id, 'listo')}
                              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                              Marcar como Listo
                            </button>
                          )}
                          {venta.estado === 'listo' && (
                            <button
                              onClick={() => handleChangeEstado(venta.id, 'entregado')}
                              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                            >
                              Marcar como Entregado
                            </button>
                          )}
                        </div>
                      )}

                      {venta.estado === 'entregado' && (
                        <div className="text-center py-2 px-4 bg-gray-100 rounded-lg">
                          <span className="text-gray-600 font-medium">Pedido completado</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
