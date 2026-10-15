import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  History,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";
import {
  getOrder,
  getOrderStatusHistory,
  updateFulfillmentStatus,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../../services/order.service";

const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const FULFILLMENT_STATUSES = [
  "UNFULFILLED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
];

const ORDER_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],

  CONFIRMED: [
    "PROCESSING",
    "CANCELLED",
  ],

  PROCESSING: [
    "SHIPPED",
    "CANCELLED",
  ],

  SHIPPED: [
    "DELIVERED",
    "RETURN_REQUESTED",
  ],

  DELIVERED: [
    "RETURN_REQUESTED",
  ],

  RETURN_REQUESTED: [
    "RETURNED",
  ],

  RETURNED: [
    "REFUNDED",
  ],

  CANCELLED: [],

  REFUNDED: [],
};

const formatStatus = (status) => {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const getStatusClasses = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "CONFIRMED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "PROCESSING":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "SHIPPED":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";

    case "RETURN_REQUESTED":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "RETURNED":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "REFUNDED":
      return "bg-slate-100 text-slate-700 border-slate-200";

    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";

    case "AUTHORIZED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "PARTIALLY_REFUNDED":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "FULFILLED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PARTIALLY_FULFILLED":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "UNFULFILLED":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
};

const SectionCard = ({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}) => {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon size={16} />
            </div>
          )}

          <h2 className="text-sm font-semibold text-slate-900">
            {title}
          </h2>
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
};

const DetailRow = ({ label, value, mono = false }) => {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-right text-sm font-medium text-slate-900 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
};

const OrderDetailsSkeleton = () => {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />

              <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map(
                  (_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="h-10 animate-pulse rounded-xl bg-slate-100"
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />

              <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map(
                  (_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="h-8 animate-pulse rounded bg-slate-100"
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [updating, setUpdating] = useState(false);

  const [statusMenuOpen, setStatusMenuOpen] =
    useState(false);

  const [paymentMenuOpen, setPaymentMenuOpen] =
    useState(false);

  const [fulfillmentMenuOpen, setFulfillmentMenuOpen] =
    useState(false);

  const [note, setNote] = useState("");

  const [confirmAction, setConfirmAction] =
    useState(null);

  const fetchOrder = useCallback(
    async (showRefresh = false) => {
      if (!id) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getOrder(id);

        if (!response?.success) {
          throw new Error(
            response?.message || "Failed to fetch order"
          );
        }

        setOrder(response?.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load order."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  const fetchHistory = useCallback(async () => {
    if (!id) return;

    try {
      const response =
        await getOrderStatusHistory(id);

      if (!response?.success) {
        return;
      }

      setHistory(response?.data || []);
    } catch {
      // History is supplementary. Keep the main
      // order details usable if this request fails.
      setHistory([]);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchHistory();
  }, [fetchOrder, fetchHistory]);

  const availableTransitions = useMemo(() => {
    if (!order?.status) return [];

    return (
      ORDER_STATUS_TRANSITIONS[order.status] || []
    );
  }, [order?.status]);

  const customerName = useMemo(() => {
    if (!order?.user) return "Guest Customer";

    const name = [
      order.user.firstName,
      order.user.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return name || order.user.email || "Guest Customer";
  }, [order?.user]);

  const itemCount = useMemo(() => {
    if (!order?.items) return 0;

    return order.items.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [order?.items]);

  const executeOrderStatusUpdate = async (
    nextStatus
  ) => {
    if (!order) return;

    try {
      setUpdating(true);
      setActionError("");

      const response = await updateOrderStatus(
        order.id,
        {
          status: nextStatus,
          note: note.trim() || undefined,
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update order status"
        );
      }

      setOrder(response?.data || order);
      setNote("");
      setConfirmAction(null);
      setStatusMenuOpen(false);

      await fetchOrder(true);
      await fetchHistory();
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const executePaymentStatusUpdate = async (
    nextStatus
  ) => {
    if (!order) return;

    try {
      setUpdating(true);
      setActionError("");

      const response =
        await updatePaymentStatus(
          order.id,
          nextStatus
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update payment status"
        );
      }

      setPaymentMenuOpen(false);
      setConfirmAction(null);

      await fetchOrder(true);
      await fetchHistory();
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update payment status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const executeFulfillmentStatusUpdate = async (
    nextStatus
  ) => {
    if (!order) return;

    try {
      setUpdating(true);
      setActionError("");

      const response =
        await updateFulfillmentStatus(
          order.id,
          nextStatus
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update fulfillment status"
        );
      }

      setFulfillmentMenuOpen(false);
      setConfirmAction(null);

      await fetchOrder(true);
      await fetchHistory();
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update fulfillment status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const requestOrderStatusUpdate = (
    nextStatus
  ) => {
    const destructive = [
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ].includes(nextStatus);

    if (destructive) {
      setConfirmAction({
        type: "order",
        status: nextStatus,
        title:
          nextStatus === "CANCELLED"
            ? "Cancel this order?"
            : nextStatus === "RETURNED"
            ? "Mark order as returned?"
            : "Refund this order?",
        description:
          nextStatus === "CANCELLED"
            ? "This will move the order into the cancelled state."
            : nextStatus === "RETURNED"
            ? "This will mark the order as returned."
            : "This will mark the order as refunded.",
      });

      return;
    }

    executeOrderStatusUpdate(nextStatus);
  };

  const requestPaymentStatusUpdate = (
    nextStatus
  ) => {
    const destructive = [
      "REFUNDED",
      "PARTIALLY_REFUNDED",
      "FAILED",
    ].includes(nextStatus);

    if (destructive) {
      setConfirmAction({
        type: "payment",
        status: nextStatus,
        title: `Change payment to ${formatStatus(
          nextStatus
        )}?`,
        description:
          "Please confirm this payment status change.",
      });

      return;
    }

    executePaymentStatusUpdate(nextStatus);
  };

  const requestFulfillmentStatusUpdate = (
    nextStatus
  ) => {
    setConfirmAction({
      type: "fulfillment",
      status: nextStatus,
      title: `Change fulfillment to ${formatStatus(
        nextStatus
      )}?`,
      description:
        "Please confirm this fulfillment status change.",
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === "order") {
      await executeOrderStatusUpdate(
        confirmAction.status
      );

      return;
    }

    if (confirmAction.type === "payment") {
      await executePaymentStatusUpdate(
        confirmAction.status
      );

      return;
    }

    if (confirmAction.type === "fulfillment") {
      await executeFulfillmentStatusUpdate(
        confirmAction.status
      );
    }
  };

  if (loading) {
    return (
      <OrderDetailsSkeleton />
    );
  }

  if (error || !order) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-900">
                Unable to load order
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error ||
                  "The requested order could not be found."}
              </p>

              <button
                type="button"
                onClick={() => fetchOrder()}
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-medium text-white hover:bg-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate("/admin/orders")
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {order.orderNumber ||
                  `Order #${order.id}`}
              </h1>

              <StatusBadge status={order.status} />
            </div>

            <p className="mt-1.5 text-sm text-slate-500">
              Placed on{" "}
              <span className="font-medium text-slate-700">
                {formatDateTime(order.createdAt)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchOrder(true);
              fetchHistory();
            }}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Action failed
            </p>

            <p className="mt-1 text-sm text-red-700">
              {actionError}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 xl:col-span-2">
          {/* Order Status */}
          <SectionCard
            title="Order Status"
            icon={Clock3}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Current Status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={order.status}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Last updated{" "}
                  {formatDateTime(order.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Available Actions
                </p>

                {availableTransitions.length ===
                0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No further order status transitions
                    are available.
                  </p>
                ) : (
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStatusMenuOpen(
                          (value) => !value
                        )
                      }
                      disabled={updating}
                      className="inline-flex h-10 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Change status
                      <ChevronDown size={15} />
                    </button>

                    {statusMenuOpen && (
                      <div className="absolute left-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        {availableTransitions.map(
                          (nextStatus) => (
                            <button
                              type="button"
                              key={nextStatus}
                              onClick={() =>
                                requestOrderStatusUpdate(
                                  nextStatus
                                )
                              }
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <span>
                                {formatStatus(
                                  nextStatus
                                )}
                              </span>

                              {[
                                "CANCELLED",
                                "RETURNED",
                                "REFUNDED",
                              ].includes(
                                nextStatus
                              ) && (
                                <AlertCircle
                                  size={14}
                                  className="text-red-500"
                                />
                              )}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="mt-5 border-t border-slate-100 pt-5">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Admin Note
                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                rows={3}
                maxLength={500}
                placeholder="Add a note for this status change..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />

              <div className="mt-1 text-right text-[11px] text-slate-400">
                {note.length}/500
              </div>
            </div>
          </SectionCard>

          {/* Order Items */}
          <SectionCard
            title={`Order Items (${itemCount})`}
            icon={ShoppingBag}
          >
            {order.items?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Product
                      </th>

                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        SKU
                      </th>

                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Qty
                      </th>

                      <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Unit Price
                      </th>

                      <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {order.items.map(
                      (item, index) => {
                        const product =
                          item.variant?.product;

                        const productName =
                          product?.name ||
                          item.productName ||
                          "Product";

                        const variantName =
                          item.variant?.name ||
                          item.variantName;

                        const sku =
                          item.variant?.sku ||
                          item.sku ||
                          "—";

                        const quantity = Number(
                          item.quantity || 0
                        );

                        const unitPrice = Number(
                          item.unitPrice ??
                            item.variant?.price ??
                            0
                        );

                        const lineTotal =
                          unitPrice * quantity;

                        return (
                          <tr key={item.id || index}>
                            <td className="py-4 pr-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                  <Package size={18} />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900">
                                    {productName}
                                  </p>

                                  {variantName && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {variantName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 pr-4">
                              <span className="font-mono text-xs text-slate-600">
                                {sku}
                              </span>
                            </td>

                            <td className="py-4 text-center">
                              <span className="text-sm font-medium text-slate-700">
                                {quantity}
                              </span>
                            </td>

                            <td className="py-4 text-right">
                              <span className="text-sm text-slate-700">
                                {formatCurrency(
                                  unitPrice
                                )}
                              </span>
                            </td>

                            <td className="py-4 text-right">
                              <span className="text-sm font-semibold text-slate-900">
                                {formatCurrency(
                                  lineTotal
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Package
                  size={24}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-2 text-sm text-slate-500">
                  No order items found.
                </p>
              </div>
            )}
          </SectionCard>

          {/* Order History */}
          <SectionCard
            title="Order History"
            icon={History}
          >
            {history.length === 0 ? (
              <div className="py-8 text-center">
                <History
                  size={24}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-2 text-sm text-slate-500">
                  No status history available.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute bottom-3 left-[15px] top-3 w-px bg-slate-200" />

                <div className="space-y-6">
                  {history.map((entry, index) => {
                    const historyStatus =
                      entry.status ||
                      entry.orderStatus ||
                      entry.newStatus;

                    const historyUser =
                      entry.user ||
                      entry.changedBy;

                    return (
                      <div
                        key={
                          entry.id || `${historyStatus}-${index}`
                        }
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-white shadow-sm">
                          <Check size={13} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {formatStatus(
                                  historyStatus
                                )}
                              </span>

                              {historyStatus && (
                                <StatusBadge
                                  status={
                                    historyStatus
                                  }
                                />
                              )}
                            </div>

                            <span className="text-xs text-slate-400">
                              {formatDateTime(
                                entry.createdAt
                              )}
                            </span>
                          </div>

                          {entry.note && (
                            <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                              {entry.note}
                            </p>
                          )}

                          {historyUser && (
                            <p className="mt-2 text-xs text-slate-400">
                              Updated by{" "}
                              <span className="font-medium text-slate-500">
                                {[
                                  historyUser.firstName,
                                  historyUser.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ") ||
                                  historyUser.email ||
                                  "Admin"}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <SectionCard
            title="Customer"
            icon={User}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <User size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {customerName}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Customer
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {order.user?.email && (
                <a
                  href={`mailto:${order.user.email}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
                >
                  <Mail
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <span className="min-w-0 truncate">
                    {order.user.email}
                  </span>
                </a>
              )}

              {order.user?.phone && (
                <a
                  href={`tel:${order.user.phone}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
                >
                  <Phone
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <span>
                    {order.user.phone}
                  </span>
                </a>
              )}
            </div>
          </SectionCard>

          {/* Payment */}
          <SectionCard
            title="Payment"
            icon={CreditCard}
          >
            <div className="space-y-1">
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={order.paymentStatus}
                  />
                }
              />

              <DetailRow
                label="Method"
                value={
                  order.payment?.method ||
                  "—"
                }
              />

              <DetailRow
                label="Amount"
                value={formatCurrency(
                  order.payment?.amount ??
                    order.totalAmount
                )}
              />

              <DetailRow
                label="Currency"
                value={
                  order.payment?.currency ||
                  "INR"
                }
              />

              <DetailRow
                label="Transaction ID"
                value={
                  order.payment?.transactionId ||
                  "—"
                }
                mono
              />

              <DetailRow
                label="Paid At"
                value={
                  order.payment?.paidAt
                    ? formatDateTime(
                        order.payment.paidAt
                      )
                    : "—"
                }
              />
            </div>

            <div className="relative mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setPaymentMenuOpen(
                    (value) => !value
                  )
                }
                disabled={updating}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Change payment status
                <ChevronDown size={15} />
              </button>

              {paymentMenuOpen && (
                <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {PAYMENT_STATUSES.map(
                    (paymentStatus) => (
                      <button
                        type="button"
                        key={paymentStatus}
                        disabled={
                          paymentStatus ===
                          order.paymentStatus
                        }
                        onClick={() =>
                          requestPaymentStatusUpdate(
                            paymentStatus
                          )
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span>
                          {formatStatus(
                            paymentStatus
                          )}
                        </span>

                        {paymentStatus ===
                          order.paymentStatus && (
                          <Check
                            size={15}
                            className="text-emerald-600"
                          />
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Fulfillment */}
          <SectionCard
            title="Fulfillment"
            icon={Truck}
          >
            <DetailRow
              label="Status"
              value={
                <StatusBadge
                  status={
                    order.fulfillmentStatus
                  }
                />
              }
            />

            <div className="relative mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setFulfillmentMenuOpen(
                    (value) => !value
                  )
                }
                disabled={updating}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Change fulfillment status
                <ChevronDown size={15} />
              </button>

              {fulfillmentMenuOpen && (
                <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {FULFILLMENT_STATUSES.map(
                    (fulfillmentStatus) => (
                      <button
                        type="button"
                        key={fulfillmentStatus}
                        disabled={
                          fulfillmentStatus ===
                          order.fulfillmentStatus
                        }
                        onClick={() =>
                          requestFulfillmentStatusUpdate(
                            fulfillmentStatus
                          )
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span>
                          {formatStatus(
                            fulfillmentStatus
                          )}
                        </span>

                        {fulfillmentStatus ===
                          order.fulfillmentStatus && (
                          <Check
                            size={15}
                            className="text-emerald-600"
                          />
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Summary */}
          <SectionCard
            title="Order Summary"
            icon={ShoppingBag}
          >
            <div className="space-y-1">
              <DetailRow
                label="Subtotal"
                value={formatCurrency(
                  order.subtotal
                )}
              />

              <DetailRow
                label="Discount"
                value={
                  order.discountAmount
                    ? `-${formatCurrency(
                        order.discountAmount
                      )}`
                    : formatCurrency(0)
                }
              />

              <DetailRow
                label="Shipping"
                value={formatCurrency(
                  order.shippingAmount
                )}
              />

              <DetailRow
                label="Tax"
                value={formatCurrency(
                  order.taxAmount
                )}
              />
            </div>

            <div className="mt-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-900">
                  Grand Total
                </span>

                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(
                    order.totalAmount
                  )}
                </span>
              </div>
            </div>

            {order.discountCode && (
              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-slate-500">
                  Discount Code
                </p>

                <p className="mt-0.5 font-mono text-sm font-medium text-slate-800">
                  {order.discountCode}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Address placeholder */}
          <SectionCard
            title="Address"
            icon={MapPin}
          >
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Address information is not available
                in the current order detail API.
              </p>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                The backend currently does not expose
                shipping or billing address data in this
                response, so the dashboard does not
                fabricate it.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close confirmation"
            onClick={() =>
              !updating && setConfirmAction(null)
            }
            className="absolute inset-0 bg-slate-950/40"
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle size={21} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {confirmAction.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {confirmAction.description}
            </p>

            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-500">
                New status
              </p>

              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {formatStatus(
                  confirmAction.status
                )}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  setConfirmAction(null)
                }
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={executeConfirmedAction}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Updating overlay */}
      {updating && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
            <Loader2
              size={16}
              className="animate-spin"
            />
            Updating order...
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;