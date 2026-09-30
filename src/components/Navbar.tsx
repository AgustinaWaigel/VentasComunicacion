import { NavLink } from "react-router-dom";
import { useState } from "react";
const links = [
  { to: "/", label: "Nueva venta" },
  { to: "/historial", label: "Historial" },
  { to: "/productos", label: "Agregar producto" },
  { to: "/editar-productos", label: "Editar productos" },
  { to: "/eventos", label: "Eventos" },
];
export default function Navbar() {
  const [abierto, setAbierto] = useState(false);
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navegación principal">
        <NavLink className="brand" to="/" onClick={() => setAbierto(false)}>
          <img
            src="/comunicacion.jpg"
            width="44"
            height="44"
            alt="Comunicación IAM"
          />
          <span>
            Comunicación<small>IAM PARANÁ</small>
          </span>
        </NavLink>
        <button
          className="menu-toggle"
          aria-expanded={abierto}
          aria-controls="navigation-links"
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? "Cerrar" : "Menú"}
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d={abierto ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
        <div
          id="navigation-links"
          className={`nav-links ${abierto ? "is-open" : ""}`}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end onClick={() => setAbierto(false)}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
