import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Loader2, Star, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useCart } from '../context/CartContext';
import CartSidebar from '../components/CartSidebar';
import ImageCarousel from '../components/ImageCarousel';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen: string | null;
  stock: number;
  imagenes?: Array<{ url: string; orden: number }>;
}

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState('relevancia');
  const { addToCart, getItemCount } = useCart();

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

  let productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria && p.stock > 0;
  });

  // Aplicar ordenamiento
  if (ordenamiento === 'precio_menor') {
    productosFiltrados = [...productosFiltrados].sort((a, b) => a.precio - b.precio);
  } else if (ordenamiento === 'precio_mayor') {
    productosFiltrados = [...productosFiltrados].sort((a, b) => b.precio - a.precio);
  } else if (ordenamiento === 'nombre') {
    productosFiltrados = [...productosFiltrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  const handleAddToCart = (producto: Producto) => {
    const imagenes = producto.imagenes && producto.imagenes.length > 0 
      ? producto.imagenes[0].url
      : producto.imagen;
    
    addToCart({
      product_id: producto.id,
      title: producto.nombre,
      unit_price: producto.precio,
      quantity: 1,
      imagen: imagenes || undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600 font-medium">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  const itemCount = getItemCount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            🛍️ Nuestro Catálogo
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Descubre nuestra selección premium de productos. Calidad, variedad y los mejores precios en un solo lugar.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="block w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 bg-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Cart floating button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed top-24 right-8 bg-white text-blue-600 p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 active:scale-95 z-50 border-2 border-blue-100"
        >
          <ShoppingBag size={28} strokeWidth={2.5} />
          {itemCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Filters and Sorting */}
        <div className="mb-8">
          {/* Categories */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Categorías</h3>
            </div>
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
              {categorias.map(categoria => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaActiva(categoria)}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all shadow-sm ${
                    categoriaActiva === categoria
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-bold text-blue-600">{productosFiltrados.length}</span> productos
              </p>
            </div>
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-600 transition-colors"
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio_menor">Menor Precio</option>
              <option value="precio_mayor">Mayor Precio</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border-2 border-gray-200">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 mb-6">Intenta con otra búsqueda o categoría.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoriaActiva('Todas');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => {
              const imagenes = producto.imagenes && producto.imagenes.length > 0
                ? producto.imagenes.sort((a, b) => a.orden - b.orden).map(img => img.url)
                : producto.imagen ? [producto.imagen] : [];

              return (
                <div 
                  key={producto.id} 
                  className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col h-full border-2 border-gray-100 hover:border-blue-300"
                >
                  {/* Image Carousel */}
                  <div className="relative">
                    <ImageCarousel 
                      images={imagenes}
                      title={producto.nombre}
                      onAddToCart={() => handleAddToCart(producto)}
                    />
                    
                    {/* Stock Badge */}
                    {producto.stock < 5 && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        ¡Últimos {producto.stock}!
                      </div>
                    )}

                    {/* Rating */}
                    <div className="absolute top-3 left-3 bg-black/60 text-yellow-400 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold backdrop-blur-sm">
                      <Star size={14} fill="currentColor" />
                      4.8
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex flex-col flex-grow">
                    {producto.categoria && (
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">
                        {producto.categoria}
                      </span>
                    )}
                    
                    <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 flex-grow line-clamp-2">
                      {producto.nombre}
                    </h3>

                    {/* Stock Indicator */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${(producto.stock / 10) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{producto.stock} disponibles</p>
                    </div>

                    {/* Price and Add Button */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-blue-600">
                          ${producto.precio.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ${(producto.precio * 1.2).toFixed(0)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(producto)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 font-bold flex items-center justify-center"
                        title="Agregar al carrito"
                      >
                        <ShoppingBag size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
