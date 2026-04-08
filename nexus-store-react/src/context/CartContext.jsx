import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadCart();
  }, [user]);

  const loadCart = async () => {
    setLoading(true);
    
    if (!user) {
      const localCart = localStorage.getItem('guest_cart');
      if (localCart) {
        const parsedCart = JSON.parse(localCart);
        setCart(parsedCart);
        updateCartCount(parsedCart);
      }
      setLoading(false);
      return;
    }

    try {
      let { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cartData) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert([{ user_id: user.id }])
          .select()
          .single();
        cartData = newCart;
      }

      if (cartData) {
        const { data: items } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cartData.id);

        if (items) {
          const formattedCart = items.map(item => ({
            id: item.product_id,
            qty: item.quantity,
            price: item.price,
            cartItemId: item.id
          }));
          setCart(formattedCart);
          updateCartCount(formattedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
    setLoading(false);
  };

  const updateCartCount = (cartItems) => {
    const total = cartItems.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(total);
  };

  const addToCart = (product, qty = 1, showToastCallback) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      let newCart;
      
      if (existing) {
        newCart = prevCart.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      } else {
        newCart = [...prevCart, { 
          id: product.id, 
          qty, 
          name: product.name, 
          price: product.price, 
          emoji: product.emoji 
        }];
      }
      
      if (!user) {
        localStorage.setItem('guest_cart', JSON.stringify(newCart));
      }
      
      updateCartCount(newCart);
      
      if (showToastCallback) {
        showToastCallback(`✅ ${product.name} adicionado ao carrinho!`);
      }
      
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== productId);
      if (!user) {
        localStorage.setItem('guest_cart', JSON.stringify(newCart));
      }
      updateCartCount(newCart);
      return newCart;
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === productId);
      if (!item) return prevCart;
      
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const newCart = prevCart.filter(i => i.id !== productId);
        if (!user) {
          localStorage.setItem('guest_cart', JSON.stringify(newCart));
        }
        updateCartCount(newCart);
        return newCart;
      }
      
      const newCart = prevCart.map(i =>
        i.id === productId ? { ...i, qty: newQty } : i
      );
      
      if (!user) {
        localStorage.setItem('guest_cart', JSON.stringify(newCart));
      }
      
      updateCartCount(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (!user) {
      localStorage.removeItem('guest_cart');
    }
    updateCartCount([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
};