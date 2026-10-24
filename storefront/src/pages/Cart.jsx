import React from "react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const Cart = () => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    cartCount,
    isEmpty,
    updateQuantity,
    removeFromCart,
  } = useCart();

  if (isEmpty) {
    return (
      <main className="min-h-[70vh] bg-white">
        <section className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-24">
          <Link
            to="/shop"
            className="mb-10 inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black"
          >
            <ArrowLeft size={14} />
            Continue shopping
          </Link>

          <div className="rounded-2xl bg-[#f7f7f5] px-6 py-20 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
              Your bag
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Add something you love and it will appear here.
            </p>
            <Link
              to="/shop"
              className="mt-7 inline-flex rounded-full px-6 py-3 text-xs font-medium ui-btn-primary"
            >
              Explore products
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-gray-200 bg-[#f7f7f5]">
        <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
            Your bag
          </p>
          <div className="mt-3 flex items-end justify-between gap-6">
            <h1 className="text-4xl font-semibold tracking-tight">
              Shopping cart
            </h1>
            <span className="hidden text-sm text-gray-500 sm:block">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.variantId}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <Link
                  to={`/products/${item.productSlug}`}
                  className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl p-3 sm:h-32 sm:w-32 ui-btn-outline"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-full w-full object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/products/${item.productSlug}`}
                        className="text-sm font-medium text-[#111] hover:underline"
                      >
                        {item.productName}
                      </Link>

                      {item.variantName && (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.variantName}
                        </p>
                      )}

                      <p className="mt-1 text-[10px] text-gray-400">
                        SKU: {item.sku}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      className="ui-btn-outline"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center rounded-full border border-gray-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        className="flex h-9 w-9 items-center justify-center ui-btn-outline"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>

                      <span className="w-8 text-center text-xs font-medium">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        disabled={item.quantity >= 99}
                        className="flex h-9 w-9 items-center justify-center disabled:opacity-30 ui-btn-outline"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <p className="text-sm font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl bg-[#f7f7f5] p-6 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold">Order summary</h2>

            <div className="mt-6 space-y-3 border-b border-black/10 pb-5 text-sm">
              <div className="flex justify-between gap-4 text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between gap-4 text-gray-500">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-5">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="w-full rounded-full py-3.5 text-xs font-medium transition ui-btn-primary"
            >
              Proceed to checkout
            </button>

            <Link
              to="/shop"
              className="mt-4 block text-center text-xs text-gray-500 hover:text-black"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default Cart;
