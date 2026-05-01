import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cartItems');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persist = (items) => {
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const addToCart = useCallback((product, qty = 1) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      let updated;
      if (exists) {
        updated = prev.map((item) =>
          item._id === product._id
            ? { ...item, qty: Math.min(item.qty + qty, item.stockQuantity) }
            : item
        );
      } else {
        updated = [...prev, { ...product, qty: Math.min(qty, product.stockQuantity) }];
      }
      localStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item._id !== productId);
      localStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQty = useCallback((productId, qty) => {
    setCartItems((prev) => {
      const updated = prev.map((item) =>
        item._id === productId ? { ...item, qty: Math.max(1, qty) } : item
      );
      localStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem('cartItems');
    setCartItems([]);
  }, []);

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cartItems.reduce((acc, item) => {
    const price = item.salePrice ?? item.price;
    return acc + price * item.qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
