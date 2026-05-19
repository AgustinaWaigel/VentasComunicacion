import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AgregarVentas from "./pages/AgregarVentass";
import AgregarProducto from "./pages/AgregarProducto";
import VerVentas from "./pages/VerVentas";
import EditarProductos from "./pages/EditarProductos";
import Eventos from "./pages/Eventos";
import Catalogo from "./pages/Catalogo";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas Privadas */}
          <Route path="/admin/ventas" element={<ProtectedRoute><AgregarVentas /></ProtectedRoute>} />
          <Route path="/admin/productos" element={<ProtectedRoute><AgregarProducto /></ProtectedRoute>} />
          <Route path="/admin/historial" element={<ProtectedRoute><VerVentas /></ProtectedRoute>} />
          <Route path="/admin/editar-productos" element={<ProtectedRoute><EditarProductos /></ProtectedRoute>} />
          <Route path="/admin/eventos" element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
