"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, getTenantSlug } from "@/lib/api";
import toast from "react-hot-toast";

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  updateQty: (productId: string, qty: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  clearCart: () => void;
  getItemQty: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cartKey, setCartKey] = useState("storefront_cart");

  // Load tenant-scoped cart from localStorage
  useEffect(() => {
    const slug = getTenantSlug();
    const key = `storefront_cart_${slug || "default"}`;
    setCartKey(key);

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to tenant-scoped localStorage
  useEffect(() => {
    if (isHydrated && cartKey) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, isHydrated, cartKey]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const index = prev.findIndex(
        (i) => i.productId === item.productId && i.variant === item.variant && i.selectedSize === item.selectedSize
      );
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
        toast.success(`Added ${item.name} to bag`);
        return [...prev, item];
      }
    });
    setIsDrawerOpen(true);
  };

  const updateQty = (productId: string, qty: number, variant?: string) => {
    if (qty <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId && (variant === undefined || i.variant === variant)) {
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

  const removeFromCart = (productId: string, variant?: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && (variant === undefined || i.variant === variant)))
    );
    toast.success("Item removed from bag");
  };

  const clearCart = () => {
    setCart([]);
  };

  const getItemQty = (productId: string): number => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.qty : 0;
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
        getItemQty,
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
