"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/lib/api";
import toast from "react-hot-toast";

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("storefront_cart");
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("storefront_cart", JSON.stringify(cart));
    }
  }, [cart, isHydrated]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const index = prev.findIndex((i) => i.productId === item.productId && i.variant === item.variant);
      if (index > -1) {
        const updated = [...prev];
        const newQty = updated[index].qty + item.qty;
        if (item.maxStock && newQty > item.maxStock) {
          toast.error(`Only ${item.maxStock} items available in stock`);
          return prev;
        }
        updated[index].qty = newQty;
        toast.success(`Updated quantity for ${item.name}`);
        return updated;
      } else {
        toast.success(`Added ${item.name} to cart`);
        return [...prev, item];
      }
    });
    setIsDrawerOpen(true);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          if (i.maxStock && qty > i.maxStock) {
            toast.error(`Only ${i.maxStock} in stock`);
            return i;
          }
          return { ...i, qty };
        }
        return i;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        isDrawerOpen,
        setIsDrawerOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
