import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    cancelOrder,
    getOrder,
    requestReturn,
} from "../../services/customer.service";

const STATUS_STEPS = [
    {
        status: "CONFIRMED",
        title: "Order confirmed",
        description:
            "Your order has been confirmed and the stock has been reserved.",
    },
    {
        status: "PROCESSING",
        title: "Processing",
        description: "We're preparing your order.",
    },
    {
        status: "SHIPPED",
        title: "Shipped",
        description: "Your order is on its way.",
    },
    {
        status: "DELIVERED",
        title: "Delivered",
        description: "Your order has been delivered.",
    },
];

const STATUS_ORDER = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
];

const SPECIAL_STATUSES = [
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
];

const formatMoney = (value, currency = "INR") => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDateTime = (value) => {
    if (!value) return "";

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
};

const formatDate = (value) => {
    if (!value) return "";

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
};

const statusLabel = (status) => {
    const labels = {
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        PROCESSING: "Processing",
        SHIPPED: "Shipped",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled",
        RETURN_REQUESTED: "Return requested",
        RETURNED: "Returned",
        REFUNDED: "Refunded",
    };

    return labels[status] || status;
};

const TimelineIcon = ({ completed, current, cancelled }) => {
    if (cancelled) {
        return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white">
                ×
            </div>
        );
    }

    if (completed) {
        return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                ✓
            </div>
        );
    }

    if (current) {
        return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white">
                <div className="h-2.5 w-2.5 rounded-full bg-black" />
            </div>
        );
    }

    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
        </div>
    );
};

const OrderTimeline = ({ order }) => {
    const history = useMemo(
        () => Array.isArray(order?.statusHistory)
            ? [...order.statusHistory].sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
            )
            : [],
        [order]
    );

    const historyByStatus = useMemo(() => {
        const map = new Map();

        history.forEach((entry) => {
            if (!map.has(entry.status)) {
                map.set(entry.status, entry);
            }
        });

        return map;
    }, [history]);

    const currentStatus = order?.status;

    /*
     * PENDING is normally extremely short-lived because checkout
     * reserves stock and moves the order to CONFIRMED.
     */
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);

    const isSpecial = SPECIAL_STATUSES.includes(currentStatus);

    if (currentStatus === "PENDING") {
        return (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                            Order status
                        </p>

                        <h2 className="mt-2 text-xl font-semibold">
                            Order is being confirmed
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            We're confirming your order and reserving the required stock.
                        </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200">
                        <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                    </div>
                </div>
            </section>
        );
    }

    if (isSpecial) {
        const special = {
            CANCELLED: {
                title: "Order cancelled",
                description:
                    "This order has been cancelled and the reserved stock has been released.",
                color: "red",
            },

            RETURN_REQUESTED: {
                title: "Return requested",
                description:
                    "We've received your return request. Our team will review it and update your order.",
                color: "black",
            },

            RETURNED: {
                title: "Order returned",
                description:
                    "The returned order has been processed.",
                color: "black",
            },

            REFUNDED: {
                title: "Refund completed",
                description:
                    "Your refund has been processed.",
                color: "black",
            },
        }[currentStatus];

        const specialHistory = history.filter(
            (entry) => entry.status === currentStatus
        );

        return (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                    Order status
                </p>

                <div className="mt-7">
                    <div className="flex items-start gap-4">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${special.color === "red"
                                    ? "bg-red-600"
                                    : "bg-black"
                                }`}
                        >
                            {currentStatus === "CANCELLED" ? "×" : "✓"}
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                {special.title}
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                {special.description}
                            </p>
                        </div>
                    </div>

                    {specialHistory.length > 0 && (
                        <div className="mt-7 space-y-4 border-l border-gray-200 pl-6">
                            {specialHistory.map((entry) => (
                                <div key={entry.id || entry.createdAt}>
                                    <p className="text-sm font-medium">
                                        {statusLabel(entry.status)}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        {formatDateTime(entry.createdAt)}
                                    </p>

                                    {entry.note && (
                                        <p className="mt-2 text-sm leading-6 text-gray-500">
                                            {entry.note}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
            <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                    Order status
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                    {statusLabel(currentStatus)}
                </h2>
            </div>

            <div className="mt-8">
                {STATUS_STEPS.map((step, index) => {
                    const entry = historyByStatus.get(step.status);

                    const completed =
                        currentIndex > index ||
                        Boolean(entry && currentIndex >= index);

                    const current =
                        currentStatus === step.status;

                    const isLast =
                        index === STATUS_STEPS.length - 1;

                    return (
                        <div
                            key={step.status}
                            className="relative flex gap-4"
                        >
                            {!isLast && (
                                <div
                                    className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-px ${completed
                                            ? "bg-black"
                                            : "bg-gray-200"
                                        }`}
                                />
                            )}

                            <div className="relative z-10 shrink-0">
                                <TimelineIcon
                                    completed={completed}
                                    current={current}
                                    cancelled={false}
                                />
                            </div>

                            <div className="min-w-0 pb-9">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h3
                                        className={`text-sm font-semibold ${current
                                                ? "text-black"
                                                : completed
                                                    ? "text-gray-800"
                                                    : "text-gray-400"
                                            }`}
                                    >
                                        {step.title}
                                    </h3>

                                    {entry?.createdAt && (
                                        <span className="text-xs text-gray-400">
                                            {formatDateTime(entry.createdAt)}
                                        </span>
                                    )}
                                </div>

                                <p
                                    className={`mt-1 max-w-xl text-sm leading-6 ${current || completed
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                        }`}
                                >
                                    {entry?.note || step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {history.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-6">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                        Order activity
                    </p>

                    <div className="mt-4 space-y-4">
                        {history.map((entry) => (
                            <div
                                key={`${entry.id || entry.status}-${entry.createdAt}`}
                                className="flex gap-3"
                            >
                                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />

                                <div>
                                    <p className="text-sm font-medium">
                                        {statusLabel(entry.status)}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        {formatDateTime(entry.createdAt)}
                                    </p>

                                    {entry.note && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            {entry.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getOrder(id);

            setOrder(data);
        } catch (error) {
            setError(error.message || "Unable to load order");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadOrder();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadOrder]);

    const canCancel =
        order &&
        ["PENDING", "CONFIRMED", "PROCESSING"].includes(
            order.status
        );

    const canReturn =
        order &&
        ["SHIPPED", "DELIVERED"].includes(
            order.status
        );

    const handleCancel = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setActionError("");

            await cancelOrder(id);

            await loadOrder();
        } catch (error) {
            setActionError(
                error.message || "Unable to cancel order"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturn = async () => {
        const confirmed = window.confirm(
            "Do you want to request a return for this order?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setActionError("");

            await requestReturn(id);

            await loadOrder();
        } catch (error) {
            setActionError(
                error.message || "Unable to request return"
            );
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-12">
                <div className="mx-auto max-w-5xl">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />

                    <div className="mt-6 h-10 w-96 max-w-full animate-pulse rounded bg-gray-200" />

                    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
                        <div className="h-96 animate-pulse rounded-3xl bg-white" />
                        <div className="h-80 animate-pulse rounded-3xl bg-white" />
                    </div>
                </div>
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-12">
                <div className="mx-auto max-w-5xl">
                    <button
                        type="button"
                        onClick={() => navigate("/account/orders")}
                        className="text-sm ui-btn-outline"
                    >
                        ← My orders
                    </button>

                    <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8">
                        <h1 className="text-xl font-semibold">
                            Unable to load this order
                        </h1>

                        <p className="mt-2 text-sm text-red-600">
                            {error || "Order not found"}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const currency = order.currency || "INR";

    const subtotal =
        Number(order.subtotal || 0);

    const shipping =
        Number(order.shippingAmount || 0);

    const tax =
        Number(order.taxAmount || 0);

    const discount =
        Number(order.discountAmount || 0);

    const total =
        Number(
            order.totalAmount ??
            subtotal +
            shipping +
            tax -
            discount
        );

    return (
        <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-12">
            <div className="mx-auto max-w-5xl">
                <Link
                    to="/account/orders"
                    className="text-sm text-gray-500 hover:text-black"
                >
                    ← My orders
                </Link>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                            Order
                        </p>

                        <h1 className="mt-2 break-all text-2xl font-semibold tracking-tight md:text-3xl">
                            {order.orderNumber}
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>

                    <p className="text-lg font-semibold">
                        {formatMoney(total, currency)}
                    </p>
                </div>

                {actionError && (
                    <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
                    <div className="space-y-6">
                        <OrderTimeline order={order} />

                        <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                                        Your items
                                    </p>

                                    <h2 className="mt-2 text-xl font-semibold">
                                        {order.items?.length || 0} item(s)
                                    </h2>
                                </div>
                            </div>

                            <div className="mt-6 divide-y divide-gray-100">
                                {order.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 py-5 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                            {item.imageUrl || item.productImage ? (
                                                <img
                                                    src={
                                                        item.imageUrl ||
                                                        item.productImage
                                                    }
                                                    alt={item.productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="px-2 text-center text-xs text-gray-400">
                                                    No image
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium">
                                                {item.productName}
                                            </h3>

                                            {item.variantName && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {item.variantName}
                                                </p>
                                            )}

                                            {item.sku && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    SKU: {item.sku}
                                                </p>
                                            )}

                                            <div className="mt-3 flex items-center justify-between gap-4">
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>

                                                <p className="text-sm font-medium">
                                                    {formatMoney(
                                                        Number(item.unitPrice || 0) *
                                                        Number(item.quantity || 0),
                                                        currency
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <section className="rounded-3xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold">
                                Order summary
                            </h2>

                            <div className="mt-6 space-y-4 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Subtotal
                                    </span>

                                    <span>
                                        {formatMoney(subtotal, currency)}
                                    </span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">
                                            Discount
                                        </span>

                                        <span className="text-green-700">
                                            -{formatMoney(discount, currency)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Shipping
                                    </span>

                                    <span>
                                        {shipping > 0
                                            ? formatMoney(
                                                shipping,
                                                currency
                                            )
                                            : "Free"}
                                    </span>
                                </div>

                                {tax > 0 && (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">
                                            Tax
                                        </span>

                                        <span>
                                            {formatMoney(tax, currency)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-5">
                                <div className="flex justify-between gap-4">
                                    <span className="font-medium">
                                        Total
                                    </span>

                                    <span className="text-lg font-semibold">
                                        {formatMoney(total, currency)}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold">
                                Payment
                            </h2>

                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Method
                                    </span>

                                    <span>
                                        {order.payment?.method ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Status
                                    </span>

                                    <span>
                                        {order.payment?.status ||
                                            order.paymentStatus ||
                                            "—"}
                                    </span>
                                </div>
                                {order.payment?.method === "COD" &&
                                    order.payment?.status !== "PAID" && (
                                        <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
                                            Payment due on delivery.
                                        </p>
                                    )}
                            </div>
                        </section>

                        {order.shippingAddress && (
                            <section className="rounded-3xl border border-gray-200 bg-white p-6">
                                <h2 className="text-lg font-semibold">
                                    Shipping address
                                </h2>

                                <div className="mt-5 text-sm leading-6 text-gray-600">
                                    {order.shippingAddress.firstName && (
                                        <p className="font-medium text-gray-900">
                                            {order.shippingAddress.firstName}{" "}
                                            {order.shippingAddress.lastName || ""}
                                        </p>
                                    )}

                                    <p>
                                        {order.shippingAddress.addressLine1}
                                    </p>

                                    {order.shippingAddress.addressLine2 && (
                                        <p>
                                            {order.shippingAddress.addressLine2}
                                        </p>
                                    )}

                                    <p>
                                        {order.shippingAddress.city},{" "}
                                        {order.shippingAddress.state}{" "}
                                        {order.shippingAddress.postalCode}
                                    </p>

                                    <p>
                                        {order.shippingAddress.country}
                                    </p>

                                    {order.shippingAddress.phone && (
                                        <p className="mt-2">
                                            {order.shippingAddress.phone}
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}

                        {(canCancel || canReturn) && (
                            <section className="rounded-3xl border border-gray-200 bg-white p-6">
                                <h2 className="text-lg font-semibold">
                                    Need help?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    You can manage this order while it is
                                    eligible for an action.
                                </p>

                                {canCancel && (
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={handleCancel}
                                        className="mt-5 w-full rounded-xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ui-btn-outline"
                                    >
                                        {actionLoading
                                            ? "Please wait..."
                                            : "Cancel order"}
                                    </button>
                                )}

                                {canReturn && (
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={handleReturn}
                                        className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ui-btn-primary"
                                    >
                                        {actionLoading
                                            ? "Please wait..."
                                            : "Request return"}
                                    </button>
                                )}
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
};

export default OrderDetail;