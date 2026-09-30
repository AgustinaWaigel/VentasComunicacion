import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import AgregarVentas from "./pages/AgregarVentass";
const AgregarProducto = lazy(() => import("./pages/AgregarProducto"));
const VerVentas = lazy(() => import("./pages/VerVentas"));
const EditarProductos = lazy(() => import("./pages/EditarProductos"));
const Eventos = lazy(() => import("./pages/Eventos"));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<p role="status">Cargando sección…</p>}><Routes>
        <Route path="/" element={<AgregarVentas />} />
        <Route path="/productos" element={<AgregarProducto />} />
        <Route path="/historial" element={<VerVentas />} />
        <Route path="/editar-productos" element={<EditarProductos />} />
        <Route path="/eventos" element={<Eventos />} />
      </Routes></Suspense>
    </Layout>
  );
}
