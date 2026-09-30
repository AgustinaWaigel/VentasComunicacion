import type { ReactNode } from "react";
import Navbar from "./Navbar";
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <Navbar />
      <main id="contenido" className="site-main">
        {children}
      </main>
      <footer className="site-footer">
        <span>
          IAM PARANÁ <b>·</b> Comunicación
        </span>
        <span>Gestión de ventas del área de Comunicación.</span>
        <small>© {new Date().getFullYear()} IAM Paraná</small>
      </footer>
    </div>
  );
}
