import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, X, ShoppingBag, Tag, TrendingUp } from 'lucide-react';
import './CartSidebar.css';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    setIsCheckingOut(true);
    onClose();
    navigate('/checkout');
  };

  const itemCount = getItemCount();
  const total = getTotal();
  const savings = cart.items.length > 0 ? Math.floor(Math.random() * total * 0.1) : 0;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="cart-overlay" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <div>
            <h2>🛒 Tu Carrito</h2>
            <p className="cart-header-subtitle">{itemCount} artículos</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingBag size={64} />
            </div>
            <h3>Carrito Vacío</h3>
            <p>Agrega productos para comenzar a comprar</p>
            <button 
              onClick={() => {
                onClose();
                navigate('/catalogo');
              }}
              className="btn-continue-shopping"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.product_id} className="cart-item">
                  {/* Product Image */}
                  {item.imagen && (
                    <div className="item-image-wrapper">
                      <img 
                        src={item.imagen} 
                        alt={item.title} 
                        className="item-image"
                      />
                    </div>
                  )}
                  
                  {/* Product Info */}
                  <div className="item-info">
                    <h4 className="item-title">{item.title}</h4>
                    <p className="item-price">${item.unit_price.toFixed(2)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="item-quantity-control">
                    <button 
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="qty-btn qty-minus"
                      title="Disminuir cantidad"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="qty-btn qty-plus"
                      title="Aumentar cantidad"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="item-subtotal">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </div>

                  {/* Delete Button */}
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    className="remove-btn"
                    title="Eliminar producto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {savings > 0 && (
                <div className="summary-row savings">
                  <span className="savings-badge">
                    <TrendingUp size={14} />
                    Ahorros
                  </span>
                  <span className="savings-amount">-${savings.toFixed(2)}</span>
                </div>
              )}
              
              <div className="summary-row total">
                <span className="total-label">Total</span>
                <span className="total-amount">${total.toFixed(2)}</span>
              </div>

              <div className="summary-info">
                <Tag size={14} />
                <p>Envío gratis en retiros</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="cart-actions">
              <button 
                className="btn-checkout"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Procesando...' : 'Proceder al Pago'}
              </button>

              <button 
                className="btn-continue-shopping-alt"
                onClick={() => {
                  onClose();
                  navigate('/catalogo');
                }}
              >
                Seguir Comprando
              </button>

              <button 
                className="btn-clear-cart"
                onClick={() => {
                  if (window.confirm('¿Deseas vaciar el carrito?')) {
                    clearCart();
                  }
                }}
              >
                Vaciar Carrito
              </button>
            </div>

            {/* Security Badge */}
            <div className="cart-security">
              <p>🔒 Pagos seguros con Mercado Pago</p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
