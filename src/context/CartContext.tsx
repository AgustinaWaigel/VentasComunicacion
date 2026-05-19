import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  product_id: number;
  title: string;
  unit_price: number;
  quantity: number;
  imagen?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

interface CartContextType {
  cart: Cart;
  addToCart: (producto: CartItem) => void;
  removeFromCart: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });

  // Cargar carrito del localStorage al montar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        console.error('Error al cargar carrito del localStorage');
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  };

  const addToCart = (producto: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find((item) => item.product_id === producto.product_id);

      let newItems;
      if (existingItem) {
        // Si el producto ya existe, sumar cantidad
        newItems = prevCart.items.map((item) =>
          item.product_id === producto.product_id
            ? { ...item, quantity: item.quantity + producto.quantity }
            : item
        );
      } else {
        // Agregar nuevo producto
        newItems = [...prevCart.items, producto];
      }

      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  };

  const removeFromCart = (product_id: number) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.product_id !== product_id);
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  };

  const updateQuantity = (product_id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(product_id);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.product_id === product_id ? { ...item, quantity } : item
      );
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0 });
  };

  const getTotal = (): number => {
    return cart.total;
  };

  const getItemCount = (): number => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};
