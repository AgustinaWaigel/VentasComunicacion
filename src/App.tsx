import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AgregarVentas from "./pages/AgregarVentass";
import AgregarProducto from "./pages/AgregarProducto";
import VerVentas from "./pages/VerVentas";
import EditarProductos from "./pages/EditarProductos";
import Eventos from "./pages/Eventos";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AgregarVentas />} />
        <Route path="/productos" element={<AgregarProducto />} />
        <Route path="/historial" element={<VerVentas />} />
        <Route path="/editar-productos" element={<EditarProductos />} />
        <Route path="/eventos" element={<Eventos />} />
      </Routes>
    </Layout>
  );
}
