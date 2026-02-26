import { useEffect, useState } from "react";
import type { Evento } from "../types";

export default function Eventos() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
    const [estadisticas, setEstadisticas] = useState<any>(null);
    const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);

    // Formulario
    const [nombre, setNombre] = useState("");
    const [fecha, setFecha] = useState("");
    const [descripcion, setDescripcion] = useState("");

    useEffect(() => {
        cargarEventos();
    }, []);

    const cargarEventos = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos`);
            if (!response.ok) throw new Error('Error al cargar eventos');
            const data = await response.json();
            setEventos(data);
        } catch (error) {
            console.error('Error:', error);
            setMensaje("❌ Error al cargar eventos");
        } finally {
            setLoading(false);
        }
    };

    const crearEvento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !fecha.trim()) {
            setMensaje("❌ Nombre y fecha son obligatorios");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, fecha, descripcion })
            });

            if (!response.ok) throw new Error('Error al crear evento');

            setMensaje("✅ Evento creado exitosamente");
            limpiarFormulario();
            cargarEventos();
        } catch (error) {
            console.error('Error:', error);
            setMensaje("❌ Error al crear evento");
        }
    };

    const editarEvento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventoSeleccionado || !nombre.trim() || !fecha.trim()) {
            setMensaje("❌ Datos incompletos");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/${eventoSeleccionado.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, fecha, descripcion })
            });

            if (!response.ok) throw new Error('Error al actualizar evento');

            setMensaje("✅ Evento actualizado exitosamente");
            limpiarFormulario();
            cargarEventos();
        } catch (error) {
            console.error('Error:', error);
            setMensaje("❌ Error al actualizar evento");
        }
    };

    const toggleEvento = async (evento: Evento) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/${evento.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...evento, activo: !evento.activo })
            });

            if (!response.ok) throw new Error('Error al cambiar estado del evento');

            setMensaje(`✅ Evento ${!evento.activo ? 'activado' : 'desactivado'} exitosamente`);
            cargarEventos();
        } catch (error) {
            console.error('Error:', error);
            setMensaje("❌ Error al cambiar estado del evento");
        }
    };

    const cargarEstadisticas = async (eventoId: number) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/${eventoId}/estadisticas`);
            if (!response.ok) throw new Error('Error al cargar estadísticas');
            const data = await response.json();
            setEstadisticas(data);
            setMostrarEstadisticas(true);
        } catch (error) {
            console.error('Error:', error);
            setMensaje("❌ Error al cargar estadísticas");
        }
    };

    const limpiarFormulario = () => {
        setNombre("");
        setFecha("");
        setDescripcion("");
        setEventoSeleccionado(null);
        setMostrarFormulario(false);
    };

    const iniciarEdicion = (evento: Evento) => {
        setEventoSeleccionado(evento);
        setNombre(evento.nombre);
        setFecha(evento.fecha.split('T')[0]); // Formato para input date
        setDescripcion(evento.descripcion || "");
        setMostrarFormulario(true);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Eventos</h1>
                <button
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {mostrarFormulario ? "Cancelar" : "Nuevo Evento"}
                </button>
            </div>

            {mensaje && (
                <div className={`p-4 rounded-lg mb-4 ${mensaje.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {mensaje}
                </div>
            )}

            {mostrarFormulario && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {eventoSeleccionado ? "Editar Evento" : "Crear Nuevo Evento"}
                    </h2>
                    <form onSubmit={eventoSeleccionado ? editarEvento : crearEvento} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Evento *
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: Feria de Navidad 2024"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Descripción opcional del evento..."
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {eventoSeleccionado ? "Actualizar" : "Crear"} Evento
                            </button>
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Lista de Eventos</h2>
                    
                    {eventos.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No hay eventos registrados</p>
                            <button
                                onClick={() => setMostrarFormulario(true)}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Crear primer evento
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fecha</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {eventos.map((evento) => (
                                        <tr key={evento.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                {evento.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {new Date(evento.fecha).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {evento.descripcion || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    evento.activo 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {evento.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => iniciarEdicion(evento)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => toggleEvento(evento)}
                                                        className={`text-sm font-medium ${
                                                            evento.activo 
                                                                ? 'text-red-600 hover:text-red-800' 
                                                                : 'text-green-600 hover:text-green-800'
                                                        }`}
                                                    >
                                                        {evento.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button
                                                        onClick={() => cargarEstadisticas(evento.id)}
                                                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                                    >
                                                        Estadísticas
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Estadísticas */}
            {mostrarEstadisticas && estadisticas && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Estadísticas del Evento</h3>
                                <button
                                    onClick={() => setMostrarEstadisticas(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-800">Total Ventas</h4>
                                    <p className="text-2xl font-bold text-blue-600">{estadisticas.totalVentas}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-800">Ingresos</h4>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${estadisticas.ingresosTotales.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-800">Ganancia</h4>
                                    <p className="text-2xl font-bold text-purple-600">
                                        ${estadisticas.gananciaTotales.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            
                            {estadisticas.topProductos.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Productos Más Vendidos</h4>
                                    <div className="space-y-2">
                                        {estadisticas.topProductos.map((producto: any, index: number) => (
                                            <div key={producto.producto_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <span className="font-medium">
                                                    {index + 1}. {producto.nombre}
                                                </span>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-600">
                                                        Cantidad: {producto.cantidad}
                                                    </div>
                                                    <div className="font-semibold">
                                                        ${producto.subtotal.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}