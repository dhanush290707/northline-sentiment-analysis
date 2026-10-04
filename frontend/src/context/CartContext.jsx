import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "northline.cart";
const CartContext = createContext(null);

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    return {
      items,
      count,
      totalCents,
      add(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((item) => item.productId === product.id);
          if (existing) {
            return current.map((item) => (
              item.productId === product.id
                ? { ...item, quantity: Math.min(5, item.quantity + quantity) }
                : item
            ));
          }
          return [...current, {
            productId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            accent: product.accent,
            motif: product.motif,
            quantity: Math.min(5, quantity),
          }];
        });
      },
      setQuantity(productId, quantity) {
        setItems((current) => current.flatMap((item) => {
          if (item.productId !== productId) return [item];
          if (quantity <= 0) return [];
          return [{ ...item, quantity: Math.min(5, quantity) }];
        }));
      },
      remove(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
