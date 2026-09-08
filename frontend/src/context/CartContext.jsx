import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "pw_cart";
const lineKey = (i) => `${i.product_id}::${i.variant}`;

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product, variant, quantity = 1) => {
    setItems((prev) => {
      const key = `${product.id}::${variant.label}`;
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing) {
        return prev.map((i) => (lineKey(i) === key ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i));
      }
      return [...prev, { product_id: product.id, name: product.name, brand: product.brand, image: product.image, variant: variant.label, price: variant.price, quantity }];
    });
  }, []);

  const setQty = useCallback((key, quantity) => {
    setItems((prev) => prev.map((i) => (lineKey(i) === key ? { ...i, quantity: Math.max(1, Math.min(10, quantity)) } : i)));
  }, []);

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => lineKey(i) !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    add,
    setQty,
    remove,
    clear,
    lineKey,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
  }), [items, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
