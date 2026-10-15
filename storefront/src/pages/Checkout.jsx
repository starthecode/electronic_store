import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import {
  createOrder,
  getAddresses,
} from "../services/customer.service";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const Checkout = () => {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    isEmpty,
    clearCart,
  } = useCart();

  const [addresses, setAddresses] =
    useState(null);

  const [shippingAddressId, setShippingAddressId] =
    useState("");

  const [billingAddressId, setBillingAddressId] =
    useState("");

  const [sameBilling, setSameBilling] =
    useState(true);

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  const [discountCode, setDiscountCode] =
    useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await getAddresses();

        if (!mounted) return;

        setAddresses(result || []);

        const shipping =
          (result || []).find(
            (address) =>
              address.type === "SHIPPING" &&
              address.isDefault
          ) ||
          (result || []).find(
            (address) =>
              address.type === "SHIPPING"
          );

        if (shipping) {
          setShippingAddressId(shipping.id);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const shippingAddresses = useMemo(
    () =>
      (addresses || []).filter(
        (address) =>
          address.type === "SHIPPING"
      ),
    [addresses]
  );

  const billingAddresses = useMemo(
    () =>
      (addresses || []).filter(
        (address) =>
          address.type === "BILLING"
      ),
    [addresses]
  );

  const selectedShipping = shippingAddresses.find(
    (address) =>
      address.id === shippingAddressId
  );

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!shippingAddressId) {
      setError(
        "Please select a shipping address."
      );
      return;
    }

    if (!sameBilling && !billingAddressId) {
      setError(
        "Please select a billing address."
      );
      return;
    }

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setPlacingOrder(true);

    try {
      const order = await createOrder({
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),

        shippingAddressId,

        billingAddressId: sameBilling
          ? shippingAddressId
          : billingAddressId,

        paymentMethod,

        discountCode:
          discountCode.trim() || undefined,
      });

      /*
       * Clear cart ONLY after the server
       * successfully creates the order.
       */
      clearCart();

      navigate(
        `/account/orders/${order.id}`,
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isEmpty) {
    return (
      <main className="min-h-[70vh] bg-white">
        <section className="mx-auto max-w-[900px] px-5 py-20 text-center">
          <h1 className="text-3xl font-semibold">
            Your cart is empty
          </h1>

          <Link
            to="/shop"
            className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-xs text-white"
          >
            Continue shopping
          </Link>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 text-sm text-gray-500">
          Loading checkout…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-gray-200 bg-[#f7f7f5]">
        <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs text-gray-500"
          >
            <ArrowLeft size={14} />
            Back to cart
          </Link>

          <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-gray-500">
            Checkout
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Complete your order
          </h1>
        </div>
      </section>

      <form
        onSubmit={placeOrder}
        className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8 lg:py-14"
      >
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">

            {/* SHIPPING ADDRESS */}

            <section className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold">
                Shipping address
              </h2>

              {shippingAddresses.length === 0 ? (
                <div className="mt-5 rounded-xl bg-[#f7f7f5] p-5">
                  <p className="text-sm text-gray-600">
                    You don't have a shipping
                    address yet.
                  </p>

                  <Link
                    to="/account/addresses"
                    className="mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-xs text-white"
                  >
                    Add address
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {shippingAddresses.map(
                    (address) => (
                      <label
                        key={address.id}
                        className={`block cursor-pointer rounded-xl border p-4 ${shippingAddressId ===
                            address.id
                            ? "border-black"
                            : "border-gray-200"
                          }`}
                      >
                        <div className="flex gap-3">
                          <input
                            type="radio"
                            name="shippingAddress"
                            value={address.id}
                            checked={
                              shippingAddressId ===
                              address.id
                            }
                            onChange={(event) =>
                              setShippingAddressId(
                                event.target.value
                              )
                            }
                          />

                          <div className="text-sm">
                            <p className="font-medium">
                              {address.firstName}{" "}
                              {address.lastName}
                            </p>

                            <p className="mt-1 leading-6 text-gray-500">
                              {
                                address.addressLine1
                              }
                              {address.addressLine2 &&
                                `, ${address.addressLine2}`}
                              <br />
                              {address.city},{" "}
                              {address.state}{" "}
                              {address.postalCode}
                              <br />
                              {
                                address.phone
                              }
                            </p>
                          </div>
                        </div>
                      </label>
                    )
                  )}
                </div>
              )}
            </section>

            {/* BILLING */}

            <section className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold">
                Billing address
              </h2>

              <label className="mt-5 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={sameBilling}
                  onChange={(event) =>
                    setSameBilling(
                      event.target.checked
                    )
                  }
                />

                Same as shipping address
              </label>

              {!sameBilling && (
                <div className="mt-5 space-y-3">
                  {billingAddresses.length ===
                    0 ? (
                    <p className="rounded-xl bg-[#f7f7f5] p-4 text-sm text-gray-500">
                      No billing addresses
                      available. Add one from
                      your account.
                    </p>
                  ) : (
                    billingAddresses.map(
                      (address) => (
                        <label
                          key={address.id}
                          className="block cursor-pointer rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex gap-3">
                            <input
                              type="radio"
                              name="billingAddress"
                              value={address.id}
                              checked={
                                billingAddressId ===
                                address.id
                              }
                              onChange={(event) =>
                                setBillingAddressId(
                                  event.target
                                    .value
                                )
                              }
                            />

                            <div className="text-sm">
                              <p className="font-medium">
                                {
                                  address.firstName
                                }{" "}
                                {
                                  address.lastName
                                }
                              </p>

                              <p className="mt-1 text-gray-500">
                                {
                                  address.addressLine1
                                }
                                <br />
                                {
                                  address.city
                                }
                                ,{" "}
                                {
                                  address.state
                                }{" "}
                                {
                                  address.postalCode
                                }
                              </p>
                            </div>
                          </div>
                        </label>
                      )
                    )
                  )}
                </div>
              )}
            </section>

            {/* PAYMENT */}

            <section className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold">
                Payment method
              </h2>

              <label className="mt-5 block cursor-pointer rounded-xl border border-black p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={
                      paymentMethod === "COD"
                    }
                    onChange={() =>
                      setPaymentMethod("COD")
                    }
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Pay when your order is
                      delivered.
                    </p>
                  </div>
                </div>
              </label>

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f7f7f5] p-4 text-xs text-gray-600">
                <ShieldCheck size={17} />
                Your order total and stock are
                validated securely by the server.
              </div>
            </section>

            {/* DISCOUNT */}

            <section className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold">
                Discount code
              </h2>

              <div className="mt-4 flex gap-3">
                <input
                  value={discountCode}
                  onChange={(event) =>
                    setDiscountCode(
                      event.target.value
                    )
                  }
                  placeholder="Enter discount code"
                  maxLength={50}
                  className="h-11 flex-1 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-black"
                />
              </div>
            </section>
          </div>

          {/* SUMMARY */}

          <aside className="h-fit rounded-2xl bg-[#f7f7f5] p-6 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold">
              Order summary
            </h2>

            <div className="mt-6 space-y-4 border-b border-black/10 pb-5">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white p-2">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-contain mix-blend-multiply"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-500">
                      Qty {item.quantity}
                    </p>
                  </div>

                  <p className="text-xs font-medium">
                    {formatPrice(
                      item.price *
                      item.quantity
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between py-5">
              <span className="text-sm">
                Subtotal
              </span>

              <span className="text-lg font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={
                placingOrder ||
                !selectedShipping
              }
              className="w-full rounded-full bg-black py-3.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-black/20"
            >
              {placingOrder
                ? "Placing order…"
                : "Place order"}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-gray-500">
              Final price, discount, tax,
              shipping and stock availability
              are verified by the server.
            </p>
          </aside>
        </div>
      </form>
    </main>
  );
};

export default Checkout;