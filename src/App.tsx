import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AgregarVentas from "./pages/AgregarVentass";
import AgregarProducto from "./pages/AgregarProducto";
import VerVentas from "./pages/VerVentas";
import EditarProductos from "./pages/EditarProductos";
import Eventos from "./pages/Eventos";
import Catalogo from "./pages/Catalogo";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Pedidos from "./pages/admin/Pedidos";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

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
      <CartProvider>
        <Layout>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Catalogo />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas */}
            <Route path="/admin/ventas" element={<ProtectedRoute><AgregarVentas /></ProtectedRoute>} />
            <Route path="/admin/productos" element={<ProtectedRoute><AgregarProducto /></ProtectedRoute>} />
            <Route path="/admin/historial" element={<ProtectedRoute><VerVentas /></ProtectedRoute>} />
            <Route path="/admin/editar-productos" element={<ProtectedRoute><EditarProductos /></ProtectedRoute>} />
            <Route path="/admin/eventos" element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
