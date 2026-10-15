import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "gearadge_cart_v1";
const CartContext = createContext(null);

const getProductImage = (product) =>
  product?.images?.find((item) => item?.isPrimary)?.url ||
  product?.images?.[0]?.url ||
  "/placeholder-product.jpg";

const getFirstAvailableVariant = (product) =>
  (product?.variants || []).find((variant) => variant?.inStock);

const createCartItem = (product, variant, quantity = 1) => ({
  variantId: variant.id,
  productId: product.id,
  productSlug: product.slug,
  productName: product.name,
  variantName: variant.name || null,
  sku: variant.sku,
  price: Number(variant.price),
  compareAtPrice:
    variant.compareAtPrice == null
      ? null
      : Number(variant.compareAtPrice),
  image: getProductImage(product),
  quantity,
});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item) =>
          item &&
          typeof item.variantId === "string" &&
          Number.isFinite(Number(item.price)) &&
          Number(item.quantity) > 0
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Local persistence is best-effort. Checkout remains server-authoritative.
    }
  }, [items]);

  const addToCart = useCallback((product, variant = null) => {
    const selectedVariant = variant || getFirstAvailableVariant(product);

    if (!selectedVariant?.id || !selectedVariant?.inStock) {
      return { success: false, reason: "OUT_OF_STOCK" };
    }

    const item = createCartItem(product, selectedVariant);

    if (!Number.isFinite(item.price)) {
      return { success: false, reason: "INVALID_PRICE" };
    }

    setItems((current) => {
      const existing = current.find(
        (entry) => entry.variantId === item.variantId
      );

      if (!existing) return [...current, item];

      return current.map((entry) =>
        entry.variantId === item.variantId
          ? {
              ...entry,
              quantity: Math.min(entry.quantity + 1, 99),
            }
          : entry
      );
    });

    return { success: true, item };
  }, []);

  const updateQuantity = useCallback((variantId, quantity) => {
    const nextQuantity = Math.max(0, Math.min(99, Number(quantity) || 0));

    setItems((current) =>
      nextQuantity === 0
        ? current.filter((item) => item.variantId !== variantId)
        : current.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: nextQuantity }
              : item
          )
    );
  }, []);

  const removeFromCart = useCallback((variantId) => {
    setItems((current) =>
      current.filter((item) => item.variantId !== variantId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotal,
      isEmpty: items.length === 0,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      items,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
