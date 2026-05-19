import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen: string | null;
  stock: number;
}

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)))];

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria && p.stock > 0;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-20 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Nuestro Catálogo
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Descubre nuestra selección de productos. Calidad y precio en un solo lugar.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="block w-full pl-12 pr-4 py-4 rounded-full text-gray-900 bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Categories */}
        {categorias.length > 1 && (
          <div className="flex overflow-x-auto gap-3 pb-4 mb-8 scrollbar-hide">
            {categorias.map(categoria => (
              <button
                key={categoria}
                onClick={() => setCategoriaActiva(categoria)}
                className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors shadow-sm ${
                  categoriaActiva === categoria
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500">Intenta con otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {productosFiltrados.map((producto) => (
              <div 
                key={producto.id} 
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full border border-gray-100"
              >
                {/* Image container */}
                <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-gray-300" />
                  )}
                  {producto.stock < 5 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      ¡Últimos {producto.stock}!
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  {producto.categoria && (
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 block">
                      {producto.categoria}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 flex-grow">
                    {producto.nombre}
                  </h3>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-gray-900">
                      ${producto.precio.toLocaleString()}
                    </span>
                    <button className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-3 transition-colors">
                      <ShoppingBag size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
