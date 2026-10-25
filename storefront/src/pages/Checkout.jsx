import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCart } from "../context/CartContext";
import {
  createAddress,
  createOrder,
  getAddresses,
  getCheckoutConfig,
  getCheckoutQuote,
  getProfile,
  updateAddress,
  verifyOrderPayment,
} from "../services/customer.service";

const DRAFT_KEY = "magdeal_checkout_draft_v1";
const indianMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const readDraft = () => {
  try {
    const value = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};
const newRequestId = () => crypto.randomUUID();
const emptyAddress = (type, profile = {}) => ({
  type,
  firstName: profile.firstName || "",
  lastName: profile.lastName || "",
  phone: profile.phone || "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
});

const AddressForm = ({ type, profile, address, onCancel, onSaved }) => {
  const [form, setForm] = useState(() => address ? { ...address } : emptyAddress(type, profile));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(form.postalCode.trim())) {
      setError("Enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!/^[+]?[0-9\s()-]{10,15}$/.test(form.phone.trim())) {
      setError("Enter a valid phone number.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        type,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: "India",
      };
      const saved = address
        ? await updateAddress(address.id, payload)
        : await createAddress(payload);
      await onSaved(saved);
    } catch (saveError) {
      setError(saveError.message || "Unable to save address.");
    } finally {
      setSaving(false);
    }
  };
  const fields = [
    ["firstName", "First name", true],
    ["lastName", "Last name", false],
    ["phone", "Mobile number", true],
    ["addressLine1", "Address line 1", true],
    ["addressLine2", "Address line 2 (optional)", false],
    ["city", "City", true],
    ["state", "State", true],
    ["postalCode", "PIN code", true],
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{address ? "Edit address" : `Add ${type.toLowerCase()} address`}</h3>
            <p className="mt-1 text-xs text-slate-500">Country: India</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close address form" className="rounded-lg p-2 ui-btn-outline"><X size={18} /></button>
        </div>
        {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label, required]) => (
            <label key={key} className={`block text-xs font-medium text-slate-700 ${key.startsWith("addressLine") ? "sm:col-span-2" : ""}`}>
              {label}
              <input
                required={required}
                type={key === "phone" ? "tel" : "text"}
                autoComplete={key === "phone" ? "tel" : undefined}
                value={form[key] || ""}
                onChange={update(key)}
                maxLength={key === "addressLine1" || key === "addressLine2" ? 255 : 100}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border px-4 py-2.5 text-sm font-medium ui-btn-outline">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving…" : "Save address"}
          </button>
        </div>
      </form>
    </div>
  );
};

const StepIndicator = ({ step, onSelect }) => {
  const steps = ["Billing", "Shipping", "Payment"];
  return (
    <ol className="grid grid-cols-3" aria-label="Checkout steps">
      {steps.map((label, index) => {
        const number = index + 1;
        const complete = step > number;
        const active = step === number;
        return (
          <li key={label} className="relative">
            {index < steps.length - 1 && <span className={`absolute left-1/2 right-0 top-5 h-0.5 ${complete ? "bg-red-600" : "bg-slate-200"}`} />}
            <button type="button" onClick={() => number < step && onSelect(number)} disabled={number >= step} className="relative flex w-full flex-col items-center gap-2 disabled:cursor-default">
              <span className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${active || complete ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-500"}`}>
                {complete ? <Check size={17} /> : number}
              </span>
              <span className={`text-xs font-semibold sm:text-sm ${active ? "text-red-700" : complete ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { items, subtotal: cartSubtotal, isEmpty, updateQuantity, removeFromCart, clearCart } = useCart();
  const [draft] = useState(readDraft);
  const [step, setStep] = useState(() => Math.min(Math.max(Number(draft.step) || 1, 1), 3));
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState(user);
  const [billingAddressId, setBillingAddressId] = useState(draft.billingAddressId || "");
  const [shippingAddressId, setShippingAddressId] = useState(draft.shippingAddressId || "");
  const [deliverToBilling, setDeliverToBilling] = useState(draft.deliverToBilling ?? true);
  const [checkoutNotes, setCheckoutNotes] = useState(draft.checkoutNotes || "");
  const [gstEnabled, setGstEnabled] = useState(draft.gstEnabled || false);
  const [businessName, setBusinessName] = useState(draft.businessName || "");
  const [gstin, setGstin] = useState(draft.gstin || "");
  const [paymentMethod, setPaymentMethod] = useState(draft.paymentMethod || "");
  const [discountCode, setDiscountCode] = useState(draft.discountCode || "");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState(draft.appliedDiscountCode || "");
  const [requestId, setRequestId] = useState(draft.requestId || newRequestId);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteRevision = useRef(0);
  const checkoutCompleted = useRef(false);
  const [cashfreeAvailable, setCashfreeAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState(() =>
    new URLSearchParams(window.location.search).has("order_id")
      ? "Checking payment status securely…"
      : ""
  );
  const [addressEditor, setAddressEditor] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    try {
      if (checkoutCompleted.current) {
        sessionStorage.removeItem(DRAFT_KEY);
        return;
      }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        step, billingAddressId, shippingAddressId, deliverToBilling,
        checkoutNotes, gstEnabled, businessName, gstin, paymentMethod,
        discountCode, appliedDiscountCode, requestId,
      }));
    } catch {
      // Checkout continues with server-owned cart and order data if storage is unavailable.
    }
  }, [step, billingAddressId, shippingAddressId, deliverToBilling, checkoutNotes, gstEnabled, businessName, gstin, paymentMethod, discountCode, appliedDiscountCode, requestId]);

  useEffect(() => {
    let active = true;
    Promise.all([getAddresses(), getProfile(), getCheckoutConfig()])
      .then(([addressData, profileData, config]) => {
        if (!active) return;
        const savedAddresses = Array.isArray(addressData) ? addressData : [];
        setAddresses(savedAddresses);
        setProfile(profileData?.user || profileData || user);
        setCashfreeAvailable(Boolean(config?.cashfreeSandboxAvailable));
        setBillingAddressId((current) => current || savedAddresses.find((address) => address.type === "BILLING" && address.isDefault)?.id || savedAddresses.find((address) => address.type === "BILLING")?.id || savedAddresses.find((address) => address.isDefault)?.id || "");
        setShippingAddressId((current) => current || savedAddresses.find((address) => address.type === "SHIPPING" && address.isDefault)?.id || savedAddresses.find((address) => address.type === "SHIPPING")?.id || "");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load your checkout details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  const shippingAddress = deliverToBilling
    ? addresses.find((address) => address.id === billingAddressId)
    : addresses.find((address) => address.id === shippingAddressId && address.type === "SHIPPING");
  const selectedBilling = addresses.find((address) => address.id === billingAddressId);
  const shippingAddresses = useMemo(() => addresses.filter((address) => address.type === "SHIPPING"), [addresses]);

  const refreshQuote = useCallback(async (code = appliedDiscountCode) => {
    const revision = ++quoteRevision.current;
    if (!items.length || !shippingAddress?.id || !billingAddressId) {
      if (revision === quoteRevision.current) setQuote(null);
      return null;
    }
    setQuoteLoading(true);
    setError("");
    try {
      const nextQuote = await getCheckoutQuote({
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        shippingAddressId: shippingAddress.id,
        billingAddressId,
        discountCode: code || undefined,
      });
      if (revision !== quoteRevision.current) return null;
      if (revision === quoteRevision.current) setQuote(nextQuote);
      return nextQuote;
    } catch (quoteError) {
      if (revision === quoteRevision.current) {
        setQuote(null);
        setError(quoteError.message || "Unable to calculate your order total.");
      }
      throw quoteError;
    } finally {
      if (revision === quoteRevision.current) setQuoteLoading(false);
    }
  }, [items, shippingAddress, billingAddressId, appliedDiscountCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loading && shippingAddress?.id && billingAddressId && items.length) {
        void refreshQuote().catch(() => {});
      } else {
        quoteRevision.current += 1;
        setQuote(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loading, shippingAddress?.id, billingAddressId, items, refreshQuote]);

  useEffect(() => {
    const returnedOrderId = searchParams.get("order_id");
    if (!returnedOrderId) return;
    let active = true;
    verifyOrderPayment(returnedOrderId)
      .then((result) => {
        if (!active) return;
        if (result?.status === "PAID") {
          checkoutCompleted.current = true;
          clearCart();
          sessionStorage.removeItem(DRAFT_KEY);
          setPaymentMessage("Payment confirmed. Your order is being prepared.");
          navigate(`/account/orders/${returnedOrderId}`, { replace: true });
        } else if (result?.status === "FAILED") {
          setPaymentMessage("Payment was not completed. Your cart is still saved; you can retry with a new payment.");
          setRequestId(newRequestId());
        } else {
          setPaymentMessage("Payment is still processing. Refresh status in a moment or check your order history.");
        }
      })
      .catch((verifyError) => {
        if (active) setPaymentMessage(verifyError.message || "Payment status could not be confirmed yet.");
      });
    return () => { active = false; };
  }, [searchParams, clearCart, navigate]);

  const saveAddress = async (savedAddress) => {
    if (savedAddress?.id) {
      setAddresses((current) => [
        ...current.filter((address) => address.id !== savedAddress.id),
        savedAddress,
      ]);
      if (addressEditor?.type === "BILLING") setBillingAddressId(savedAddress.id);
      if (addressEditor?.type === "SHIPPING") {
        setShippingAddressId(savedAddress.id);
        setDeliverToBilling(false);
      }
    }
    setAddressEditor(null);
    try {
      const refreshed = await getAddresses();
      setAddresses(Array.isArray(refreshed) ? refreshed : []);
    } catch (refreshError) {
      setError(`Address saved, but the address list could not be refreshed: ${refreshError.message}`);
    }
  };

  const applyCoupon = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Enter a coupon code.");
      return;
    }
    try {
      await refreshQuote(code);
      setAppliedDiscountCode(code);
      setDiscountCode(code);
      setCouponMessage("Coupon applied.");
    } catch (couponError) {
      setAppliedDiscountCode("");
      setCouponMessage(couponError.message);
    }
  };

  const continueToShipping = () => {
    setError("");
    if (!billingAddressId || !selectedBilling) {
      setError("Add or select a billing address to continue.");
      return;
    }
    if (gstEnabled && (!businessName.trim() || !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(gstin.trim()))) {
      setError("Enter a business name and valid 15-character GSTIN.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const continueToPayment = async () => {
    if (!deliverToBilling && !shippingAddress) {
      setError("Add or select a shipping address to continue.");
      return;
    }
    try {
      setError("");
      const nextQuote = await refreshQuote();
      if (!nextQuote) return;
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // The quote error is already shown inline.
    }
  };

  const loadCashfreeSdk = () => new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve(window.Cashfree);
    const existing = document.querySelector('script[data-cashfree-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Cashfree), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Cashfree checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error("Cashfree checkout did not initialize."));
    script.onerror = () => reject(new Error("Unable to load Cashfree checkout."));
    document.head.appendChild(script);
  });

  const placeOrder = async (event) => {
    event.preventDefault();
    if (step !== 3) return;
    setError("");
    if (!paymentMethod) {
      setError("Select a payment method to place your order.");
      return;
    }
    if (!quote) {
      setError("Your order total is not ready. Review your addresses and try again.");
      return;
    }
    if (gstEnabled && (!businessName.trim() || !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(gstin.trim()))) {
      setError("Enter a business name and valid 15-character GSTIN.");
      return;
    }
    const phone = shippingAddress?.phone || selectedBilling?.phone || profile?.phone || "";
    if (paymentMethod !== "COD" && !phone) {
      setError("Add a mobile number to the selected address before online payment.");
      return;
    }
    setPlacingOrder(true);
    try {
      const order = await createOrder({
        requestId,
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        shippingAddressId: shippingAddress.id,
        billingAddressId,
        paymentMethod,
        discountCode: appliedDiscountCode || undefined,
        checkoutNotes: checkoutNotes.trim() || undefined,
        gstDetails: gstEnabled ? { businessName: businessName.trim(), gstin: gstin.trim().toUpperCase() } : undefined,
      });
      if (paymentMethod === "COD") {
        checkoutCompleted.current = true;
        clearCart();
        sessionStorage.removeItem(DRAFT_KEY);
        navigate(`/account/orders/${order.id}`, { replace: true });
        return;
      }
      if (!order.paymentSessionId) {
        throw new Error("The payment session was not created. Your cart is unchanged; choose another payment method or retry.");
      }
      const cashfreeFactory = await loadCashfreeSdk();
      const cashfree = cashfreeFactory({ mode: "sandbox" });
      await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (placeError) {
      setError(placeError.message || "Unable to place your order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isEmpty && !searchParams.get("order_id")) {
    return <main className="min-h-[65vh] bg-slate-50 px-5 py-20 text-center"><h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1><Link to="/shop" className="mt-6 inline-flex rounded-lg px-5 py-3 text-sm ui-btn-primary">Continue shopping</Link></main>;
  }

  if (loading) {
    return <main className="flex min-h-[65vh] items-center justify-center bg-slate-50 text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" /> Loading your secure checkout…</main>;
  }

  const orderSubtotal = quote?.subtotal ?? cartSubtotal;
  const payable = quote?.totalAmount;
  const stepTitle = ["", "Billing information", "Shipping details", "Payment method"][step];
  const inputClass = "h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600">MagDeal</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#14213d] sm:text-3xl">Secure Checkout</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><LockKeyhole size={16} className="text-green-600" /> Secure checkout</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-10">
          <StepIndicator step={step} onSelect={setStep} />
        </div>
        {paymentMessage && <div role="status" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{paymentMessage}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <form onSubmit={placeOrder}>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Step {step} of 3</p>
                    <h2 className="mt-1 text-xl font-bold text-[#14213d]">{stepTitle}</h2>
                  </div>
                  {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-semibold text-slate-700 ui-btn-outline">Back</button>}
                </div>

                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
                      <UserRound size={18} className="mt-0.5 text-slate-500" />
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold">Account information</p>
                        <p className="mt-1 break-all text-slate-600">{profile?.email || user?.email}</p>
                        <p className="mt-0.5 text-slate-600">{profile?.phone || "Mobile number can be added with your address"}</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="font-semibold">Billing address</h3>
                        <button type="button" onClick={() => setAddressEditor({ type: "BILLING" })} className="text-sm font-semibold text-red-700 ui-btn-outline">+ Add billing address</button>
                      </div>
                      {addresses.length === 0 && <p className="rounded-lg border border-dashed p-5 text-sm text-slate-500">No saved addresses yet. Add a billing address to continue.</p>}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {addresses.filter((address) => address.type === "BILLING").map((address) => (
                          <div key={address.id} role="radio" aria-checked={billingAddressId === address.id} tabIndex={0} onClick={() => setBillingAddressId(address.id)} onKeyDown={(event) => event.key === "Enter" && setBillingAddressId(address.id)} className={`cursor-pointer rounded-xl border p-4 transition ${billingAddressId === address.id ? "border-red-500 bg-red-50/50 ring-1 ring-red-500" : "border-slate-200 hover:border-slate-400"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2"><input type="radio" checked={billingAddressId === address.id} readOnly className="mt-1 accent-red-600" /><div><p className="text-sm font-semibold">{address.firstName} {address.lastName}</p><p className="mt-1 text-xs leading-5 text-slate-600">{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.state} {address.postalCode}<br />{address.phone}</p><span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{address.type === "BILLING" ? "Billing" : "Saved address"}</span></div></div>
                              <button type="button" onClick={(event) => { event.stopPropagation(); setAddressEditor({ type: "BILLING", address }); }} className="text-xs font-semibold text-slate-600 ui-btn-outline">Edit</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                        <input type="checkbox" checked={gstEnabled} onChange={(event) => setGstEnabled(event.target.checked)} className="h-4 w-4 accent-red-600" />
                        I need a B2B GST Invoice
                      </label>
                      {gstEnabled && <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-medium">Business name<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required className={`${inputClass} mt-1.5`} /></label>
                        <label className="text-xs font-medium">GSTIN<input value={gstin} onChange={(event) => setGstin(event.target.value.toUpperCase())} required minLength={15} maxLength={15} pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]" className={`${inputClass} mt-1.5 uppercase`} /></label>
                      </div>}
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={continueToShipping} className="rounded-lg bg-[#14213d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Continue to Shipping</button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
                      <input type="checkbox" checked={deliverToBilling} onChange={(event) => setDeliverToBilling(event.target.checked)} className="h-4 w-4 accent-red-600" />
                      Deliver to billing address
                    </label>
                    {deliverToBilling ? (
                      selectedBilling ? (
                        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50/40 p-4"><MapPin size={18} className="mt-0.5 text-red-600" /><div className="text-sm"><p className="font-semibold">{selectedBilling.firstName} {selectedBilling.lastName}</p><p className="mt-1 leading-6 text-slate-600">{selectedBilling.addressLine1}{selectedBilling.addressLine2 && `, ${selectedBilling.addressLine2}`}<br />{selectedBilling.city}, {selectedBilling.state} {selectedBilling.postalCode}<br />{selectedBilling.phone}</p></div></div>
                      ) : <p className="text-sm text-red-700">Select a billing address first.</p>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Shipping address</h3><button type="button" onClick={() => setAddressEditor({ type: "SHIPPING" })} className="text-sm font-semibold text-red-700 ui-btn-outline">+ Add shipping address</button></div>
                        {shippingAddresses.length === 0 ? <p className="rounded-lg border border-dashed p-5 text-sm text-slate-500">No saved shipping addresses. Add one to continue.</p> : <div className="space-y-3">{shippingAddresses.map((address) => <div key={address.id} role="radio" aria-checked={shippingAddressId === address.id} tabIndex={0} onClick={() => setShippingAddressId(address.id)} onKeyDown={(event) => event.key === "Enter" && setShippingAddressId(address.id)} className={`cursor-pointer rounded-xl border p-4 ${shippingAddressId === address.id ? "border-red-500 bg-red-50/50" : "border-slate-200"}`}><div className="flex items-start justify-between"><div className="flex gap-3"><input type="radio" readOnly checked={shippingAddressId === address.id} className="mt-1 accent-red-600" /><div className="text-sm"><p className="font-semibold">{address.firstName} {address.lastName}</p><p className="mt-1 leading-5 text-slate-600">{address.addressLine1}, {address.city}, {address.state} {address.postalCode}<br />{address.phone}</p></div></div><button type="button" onClick={(event) => { event.stopPropagation(); setAddressEditor({ type: "SHIPPING", address }); }} className="text-xs font-semibold ui-btn-outline">Edit</button></div></div>)}</div>}
                      </div>
                    )}
                    <label className="block text-xs font-semibold">Delivery instructions / order notes <span className="font-normal text-slate-500">(optional)</span><textarea value={checkoutNotes} onChange={(event) => setCheckoutNotes(event.target.value)} rows={3} maxLength={1000} placeholder="Share access or delivery instructions" className="mt-2 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-red-500" /></label>
                    <div className="flex justify-between"><button type="button" onClick={() => setStep(1)} className="rounded-lg border px-5 py-3 text-sm font-semibold text-slate-700 ui-btn-outline">Back to Billing</button><button type="button" onClick={continueToPayment} disabled={quoteLoading} className="rounded-lg bg-[#14213d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">Continue to Payment</button></div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Choose how you would like to pay. Online payment is hosted by Cashfree.</p>
                    {[
                      { id: "UPI", title: "Pay via UPI", detail: "Pay securely using your preferred UPI app.", icon: Wallet, disabled: !cashfreeAvailable },
                      { id: "CARD", title: "EMI / Credit Card / Debit Card / Net Banking", detail: "Secure online payments powered by Cashfree.", icon: CreditCard, disabled: !cashfreeAvailable },
                      { id: "COD", title: "Cash on Delivery (COD)", detail: "Pay when your order is delivered.", icon: Truck, disabled: false },
                    ].map(({ id, title, detail, icon: Icon, disabled }) => (
                      <label key={id} className={`flex items-start gap-4 rounded-xl border p-4 transition ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"} ${paymentMethod === id ? "border-red-500 bg-red-50/50 ring-1 ring-red-500" : "border-slate-200 hover:border-slate-400"}`}>
                        <input type="radio" name="payment" value={id} checked={paymentMethod === id} disabled={disabled} onChange={() => setPaymentMethod(id)} className="mt-1 h-4 w-4 accent-red-600" />
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${paymentMethod === id ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}><Icon size={20} /></span>
                        <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>                        {disabled && <span className="mt-1 block text-xs font-medium text-amber-700">Cashfree sandbox is not fully configured.</span>}{id === "COD" && paymentMethod === id && <span className="mt-2 block text-xs font-semibold text-red-700">Payment due on delivery.</span>}</span>
                        {paymentMethod === id && <Check size={18} className="text-red-600" />}
                      </label>
                    ))}
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-green-700" /><span>Prices, discounts, taxes, delivery charges, and stock are revalidated by MagDeal before the order is created. Online payment status is confirmed by the server.</span></div>
                    <div className="flex justify-between"><button type="button" onClick={() => setStep(2)} className="rounded-lg border px-5 py-3 text-sm font-semibold text-slate-700 ui-btn-outline">Back to Shipping</button></div>
                  </div>
                )}
              </section>
              <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 ui-btn-outline"><ArrowLeft size={16} /> Return to cart</Link>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-6">
              <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#14213d]">Order summary</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
              <div className="mt-5 max-h-[360px] space-y-4 overflow-y-auto">
                {items.map((item) => {
                  const quoteItem = quote?.items?.find((row) => row.variantId === item.variantId);
                  const unitPrice = quoteItem?.unitPrice ?? item.price;
                  return <article key={item.variantId} className="flex gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-2"><img src={item.image} alt={item.productName} className="h-full w-full object-contain" /></div>
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-semibold">{item.productName}</p>{item.variantName && <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.variantName}</p>}<p className="mt-1 text-xs font-bold">{indianMoney(unitPrice)}</p><div className="mt-2 flex items-center gap-2"><button type="button" aria-label={`Decrease quantity of ${item.productName}`} onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded border ui-btn-outline"><Minus size={12} /></button><span className="min-w-5 text-center text-xs">{item.quantity}</span><button type="button" aria-label={`Increase quantity of ${item.productName}`} onClick={() => updateQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= 99} className="flex h-7 w-7 items-center justify-center rounded border disabled:opacity-40 ui-btn-outline"><Plus size={12} /></button><button type="button" onClick={() => removeFromCart(item.variantId)} className="ml-auto text-[11px] font-medium text-red-700 ui-btn-danger">Remove</button></div></div>
                    <p className="shrink-0 text-xs font-semibold">{indianMoney(unitPrice * item.quantity)}</p>
                  </article>;
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} maxLength={50} placeholder="Coupon code" aria-label="Coupon code" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-red-500" />
                <button type="button" onClick={applyCoupon} disabled={quoteLoading || !shippingAddress || !billingAddressId} className="rounded-lg border px-3 text-xs font-semibold ui-btn-outline disabled:opacity-50">Apply</button>
              </div>
              {couponMessage && <p role="status" className={`mt-2 text-xs ${couponMessage.toLowerCase().includes("applied") ? "text-green-700" : "text-red-700"}`}>{couponMessage}</p>}
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{quoteLoading ? "Calculating…" : indianMoney(orderSubtotal)}</span></div>
                {quote?.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount{quote.discountCode ? ` (${quote.discountCode})` : ""}</span><span>−{indianMoney(quote.discountAmount)}</span></div>}
                <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{quote ? indianMoney(quote.shippingAmount) : "Calculated at checkout"}</span></div>
                {quote?.taxAmount > 0 && <div className="flex justify-between text-slate-600"><span>Tax</span><span>{indianMoney(quote.taxAmount)}</span></div>}
                <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-extrabold"><span>Total payable</span><span className="text-xl text-red-600">{quoteLoading || payable === undefined ? "—" : indianMoney(payable)}</span></div>
                {paymentMethod === "COD" && step === 3 && <p className="text-right text-xs font-semibold text-red-700">Payment due on delivery</p>}
              </div>
              {step === 3 ? (
                <button type="submit" disabled={placingOrder || !paymentMethod || !quote || quoteLoading || !items.length} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {placingOrder && <Loader2 size={16} className="animate-spin" />}
                  {placingOrder ? "Processing…" : paymentMethod === "COD" ? "Place Order Now" : "Continue to secure payment"}
                </button>
              ) : <button type="button" onClick={step === 1 ? continueToShipping : continueToPayment} disabled={quoteLoading || !items.length} className="mt-5 w-full rounded-lg bg-[#14213d] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50">{step === 1 ? "Continue to Shipping" : "Continue to Payment"}</button>}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500"><LockKeyhole size={12} /> Your payment details are handled securely.</p>
              <p className="mt-2 text-center text-[11px] text-slate-500">Shipping and tax are currently ₹0 under configured checkout rules.</p>
            </aside>
          </div>
        </form>
      </div>

      {addressEditor && <AddressForm
        type={addressEditor.type}
        profile={profile}
        address={addressEditor.address}
        onCancel={() => setAddressEditor(null)}
        onSaved={saveAddress}
      />}
    </main>
  );
};

export default Checkout;
