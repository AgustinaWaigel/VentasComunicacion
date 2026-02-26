import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { 
      to: "/", 
      label: "Agregar Venta",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M7 13l-1.5-9m0 0h2m13 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        </svg>
      )
    },
    { 
      to: "/productos", 
      label: "Agregar Producto",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    { 
      to: "/historial", 
      label: "Ver Ventas",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      to: "/editar-productos", 
      label: "Editar Productos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    { 
      to: "/eventos", 
      label: "Eventos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800 text-white shadow-xl fixed w-full top-0 z-50 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y nombre */}
          <Link 
            to="/" 
            className="flex items-center gap-3 text-xl font-bold hover:opacity-90 transition-all duration-300 group"
          >
            <div className="relative">
              <img 
                src="/comunicacion.jpg" 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 shadow-lg" 
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
            <div className="hidden sm:block">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Ventas de Comunicación
              </span>
            </div>
          </Link>

          {/* Menu desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {links.map(({ to, label, icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                    active 
                      ? "bg-white/10 text-yellow-300 shadow-lg backdrop-blur-sm" 
                      : "text-white/90 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {icon}
                  </span>
                  <span className="hidden xl:block">{label}</span>
                  
                  {/* Indicador activo */}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full"></div>
                  )}
                  
                  {/* Efecto hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              );
            })}
          </div>

          {/* Botón menú móvil */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden relative p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu móvil */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <div className="space-y-2">
              {links.map(({ to, label, icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      active 
                        ? "bg-white/10 text-yellow-300 shadow-lg" 
                        : "text-white/90 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
