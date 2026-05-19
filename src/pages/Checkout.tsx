import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/api';

interface FormData {
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string;
  tipoEntrega: 'retiro' | 'envio';
}

interface CheckoutStep {
  number: number;
  title: string;
  completed: boolean;
}

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteDireccion: '',
    tipoEntrega: 'retiro',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.clienteNombre.trim()) {
      setError('Por favor ingresa tu nombre');
      return false;
    }
    if (!formData.clienteTelefono.trim()) {
      setError('Por favor ingresa tu teléfono');
      return false;
    }
    if (formData.tipoEntrega === 'envio' && !formData.clienteDireccion.trim()) {
      setError('Por favor ingresa tu dirección');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setError('');
      setCurrentStep(2);
    }
  };

  const handleCreatePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/pagos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            title: item.title,
            unit_price: item.unit_price,
            quantity: item.quantity,
            product_id: item.product_id,
          })),
          clienteNombre: formData.clienteNombre,
          clienteTelefono: formData.clienteTelefono,
          clienteDireccion: formData.clienteDireccion,
          tipoEntrega: formData.tipoEntrega,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el pago');
      }

      const { initPoint } = await response.json();

      if (initPoint) {
        clearCart();
        // Redirigir a Mercado Pago
        window.location.href = initPoint;
      } else {
        setError('No se pudo crear el enlace de pago');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Hubo un error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Carrito Vacío</h2>
            <p className="text-gray-600 mb-8">Tu carrito está vacío. Vuelve al catálogo para agregar productos.</p>
            <button
              onClick={() => navigate('/catalogo')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={20} />
              Volver al Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/catalogo')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver al catálogo
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Steps indicator */}
        <div className="mb-8 flex gap-4">
          <div className={`flex-1 py-3 px-4 rounded-lg font-medium text-center transition-all ${
            currentStep >= 1 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            1. Datos
          </div>
          <div className={`flex-1 py-3 px-4 rounded-lg font-medium text-center transition-all ${
            currentStep >= 2 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            2. Resumen
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {currentStep === 1 ? (
              // Step 1: Customer info
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Tus Datos</h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="clienteNombre"
                      value={formData.clienteNombre}
                      onChange={handleInputChange}
                      placeholder="Juan Pérez"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono/WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="clienteTelefono"
                      value={formData.clienteTelefono}
                      onChange={handleInputChange}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Entrega *
                    </label>
                    <select
                      name="tipoEntrega"
                      value={formData.tipoEntrega}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="retiro">Retiro en el local</option>
                      <option value="envio">Envío a domicilio</option>
                    </select>
                  </div>

                  {formData.tipoEntrega === 'envio' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección de Envío *
                      </label>
                      <input
                        type="text"
                        name="clienteDireccion"
                        value={formData.clienteDireccion}
                        onChange={handleInputChange}
                        placeholder="Calle Principal 123, Apartamento 4B"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleContinue}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Continuar al Resumen
                  </button>
                </div>
              </div>
            ) : (
              // Step 2: Order summary
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                    {error}
                  </div>
                )}

                {/* Order items */}
                <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
                  {cart.items.map(item => (
                    <div key={item.product_id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">${(item.unit_price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Customer info review */}
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Información del Pedido</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Nombre:</strong> {formData.clienteNombre}</p>
                    <p><strong>Teléfono:</strong> {formData.clienteTelefono}</p>
                    <p><strong>Entrega:</strong> {formData.tipoEntrega === 'retiro' ? 'Retiro en local' : 'Envío a domicilio'}</p>
                    {formData.tipoEntrega === 'envio' && (
                      <p><strong>Dirección:</strong> {formData.clienteDireccion}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Editar Datos
                  </button>
                  <button
                    onClick={handleCreatePayment}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={20} className="animate-spin" />}
                    {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen</h3>
              
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {cart.items.map(item => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.title}</span>
                    <span className="font-medium text-gray-900">${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío:</span>
                  <span className={formData.tipoEntrega === 'retiro' ? 'text-green-600 font-medium' : '$0'}>
                    {formData.tipoEntrega === 'retiro' ? 'Gratis' : '$0'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
