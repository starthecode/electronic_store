import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

import {
  cancelOrder,
  fulfillOrder,
  releaseStock,
  reserveStock,
  returnOrder,
} from "../../services/fulfillment.service";

import { getOrder } from "../../services/order.service";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : "—";

const customerName = (user) => {
  if (!user) return "Guest Customer";

  const name = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Customer";
};

const Badge = ({
  children,
  type = "neutral",
}) => {
  const classes = {
    neutral:
      "bg-slate-100 text-slate-700",
    success:
      "bg-emerald-50 text-emerald-700",
    warning:
      "bg-amber-50 text-amber-700",
    danger:
      "bg-red-50 text-red-700",
    info:
      "bg-blue-50 text-blue-700",
    purple:
      "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        classes[type]
      }`}
    >
      {children}
    </span>
  );
};

const getFulfillmentType = (status) => {
  if (status === "FULFILLED")
    return "success";

  if (status === "PARTIALLY_FULFILLED")
    return "warning";

  return "neutral";
};

const getPaymentType = (status) => {
  if (status === "PAID")
    return "success";

  if (status === "FAILED")
    return "danger";

  if (
    status === "AUTHORIZED"
  )
    return "info";

  return "warning";
};

const getOrderType = (status) => {
  if (
    status === "DELIVERED"
  )
    return "success";

  if (
    status === "CANCELLED" ||
    status === "REFUNDED"
  )
    return "danger";

  if (
    status === "SHIPPED"
  )
    return "purple";

  return "info";
};

const FulfillmentDetails = () => {
  const id = window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  const [note, setNote] =
    useState("");

  const fetchOrder = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getOrder(id);

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to fetch order"
          );
        }

        setOrder(response.data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch order"
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const runAction = async (
    action,
    callback,
    requiresNote = false
  ) => {
    if (requiresNote && !note.trim()) {
      window.alert(
        "Please enter a note before continuing."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action}?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(action);
      setError("");

      await callback();

      setNote("");

      await fetchOrder();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${action}`
      );
    } finally {
      setActionLoading("");
    }
  };

  const actions = useMemo(() => {
    if (!order) return {};

    const {
      status,
      fulfillmentStatus,
    } = order;

    return {
      canReserve:
        status === "PENDING" &&
        fulfillmentStatus ===
          "UNFULFILLED",

      canRelease:
        [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
        ].includes(status) &&
        fulfillmentStatus !==
          "FULFILLED",

      canFulfill:
        status === "PROCESSING" &&
        fulfillmentStatus !==
          "FULFILLED",

      canCancel:
        [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
        ].includes(status),

      canReturn:
        status ===
        "RETURN_REQUESTED",
    };
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {Array.from(
              { length: 6 },
              (_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl bg-white"
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-full bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error ||
              "Order not found"}
          </div>
        </div>
      </div>
    );
  }

  const items = order.items || [];

  return (
    <div className="min-h-full bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                window.history.back()
              }
              className="mb-4 inline-flex items-center gap-2 text-sm ui-btn-outline"
            >
              <ArrowLeft size={17} />
              Back to Fulfillment
            </button>

            <h1 className="text-2xl font-semibold text-slate-950">
              Fulfillment
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Order{" "}
              <span className="font-medium text-slate-700">
                {order.orderNumber}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              type={getOrderType(
                order.status
              )}
            >
              {order.status
                ?.toLowerCase()
                .split("_")
                .map(
                  (word) =>
                    word
                      .charAt(0)
                      .toUpperCase() +
                    word.slice(1)
                )
                .join(" ")}
            </Badge>

            <Badge
              type={getPaymentType(
                order.paymentStatus
              )}
            >
              Payment:{" "}
              {order.paymentStatus}
            </Badge>

            <Badge
              type={getFulfillmentType(
                order.fulfillmentStatus
              )}
            >
              {order.fulfillmentStatus
                ?.toLowerCase()
                .split("_")
                .map(
                  (word) =>
                    word
                      .charAt(0)
                      .toUpperCase() +
                    word.slice(1)
                )
                .join(" ")}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="font-semibold text-slate-900">
                  Order Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}{" "}
                  in this order
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <Package
                          size={21}
                          className="text-slate-500"
                        />
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          {item.productName ||
                            item.variant
                              ?.product
                              ?.name ||
                            "Product"}
                        </p>

                        {(
                          item.variantName ||
                          item.variant?.name
                        ) && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.variantName ||
                              item.variant
                                ?.name}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-400">
                          SKU:{" "}
                          {item.sku ||
                            item.variant
                              ?.sku ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          Quantity
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Unit Price
                        </p>

                        <p className="mt-1 font-medium text-slate-900">
                          {money(
                            item.unitPrice
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="font-semibold text-slate-900">
                  Fulfillment Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Inventory operations are
                  performed transactionally.
                </p>
              </div>

              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {actions.canReserve && (
                    <button
                      type="button"
                      disabled={
                        !!actionLoading
                      }
                      onClick={() =>
                        runAction(
                          "reserve stock",
                          () =>
                            reserveStock(
                              order.id
                            )
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium disabled:opacity-50 ui-btn-outline"
                    >
                      <Package size={17} />
                      {actionLoading ===
                      "reserve stock"
                        ? "Reserving..."
                        : "Reserve Stock"}
                    </button>
                  )}

                  {actions.canRelease && (
                    <button
                      type="button"
                      disabled={
                        !!actionLoading
                      }
                      onClick={() =>
                        runAction(
                          "release stock",
                          () =>
                            releaseStock(
                              order.id
                            )
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium disabled:opacity-50 ui-btn-outline"
                    >
                      <RotateCcw size={17} />
                      {actionLoading ===
                      "release stock"
                        ? "Releasing..."
                        : "Release Stock"}
                    </button>
                  )}

                  {actions.canFulfill && (
                    <button
                      type="button"
                      disabled={
                        !!actionLoading
                      }
                      onClick={() =>
                        runAction(
                          "fulfill order",
                          () =>
                            fulfillOrder(
                              order.id
                            )
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 ui-btn-success"
                    >
                      <Truck size={17} />
                      {actionLoading ===
                      "fulfill order"
                        ? "Fulfilling..."
                        : "Mark Fulfilled"}
                    </button>
                  )}

                  {actions.canCancel && (
                    <button
                      type="button"
                      disabled={
                        !!actionLoading
                      }
                      onClick={() =>
                        runAction(
                          "cancel order",
                          () =>
                            cancelOrder(
                              order.id,
                              note.trim()
                            ),
                          true
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 ui-btn-danger"
                    >
                      <XCircle size={17} />
                      {actionLoading ===
                      "cancel order"
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </button>
                  )}

                  {actions.canReturn && (
                    <button
                      type="button"
                      disabled={
                        !!actionLoading
                      }
                      onClick={() =>
                        runAction(
                          "return order",
                          () =>
                            returnOrder(
                              order.id,
                              note.trim()
                            ),
                          true
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium disabled:opacity-50 ui-btn-primary"
                    >
                      <RotateCcw size={17} />
                      {actionLoading ===
                      "return order"
                        ? "Returning..."
                        : "Process Return"}
                    </button>
                  )}
                </div>

                {(actions.canCancel ||
                  actions.canReturn) && (
                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Action Note
                    </label>

                    <textarea
                      value={note}
                      onChange={(event) =>
                        setNote(
                          event.target.value
                        )
                      }
                      rows={3}
                      maxLength={500}
                      placeholder="Enter reason or operational note..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="font-semibold text-slate-900">
                  Order Timeline
                </h2>
              </div>

              <div className="p-6">
                {order.statusHistory?.length ? (
                  <div className="space-y-5">
                    {order.statusHistory.map(
                      (history) => (
                        <div
                          key={history.id}
                          className="flex gap-4"
                        >
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <CheckCircle2
                              size={17}
                              className="text-slate-600"
                            />
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {history.status
                                ?.toLowerCase()
                                .split("_")
                                .map(
                                  (word) =>
                                    word
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase() +
                                    word.slice(
                                      1
                                    )
                                )
                                .join(" ")}
                            </p>

                            {history.note && (
                              <p className="mt-1 text-sm text-slate-500">
                                {history.note}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-slate-400">
                              {dateTime(
                                history.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No status history available.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Customer
              </h2>

              <div className="mt-5">
                <p className="font-medium text-slate-900">
                  {customerName(
                    order.user
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {order.user?.email ||
                    "—"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {order.user?.phone ||
                    "—"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Payment
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Status
                  </span>

                  <Badge
                    type={getPaymentType(
                      order.paymentStatus
                    )}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Method
                  </span>

                  <span className="font-medium text-slate-800">
                    {order.payment?.method ||
                      "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Transaction
                  </span>

                  <span className="max-w-[180px] truncate font-medium text-slate-800">
                    {order.payment
                      ?.transactionId ||
                      "—"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Order Total
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span>
                    {money(
                      order.subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Discount
                  </span>

                  <span>
                    -{money(
                      order.discountAmount
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Shipping
                  </span>

                  <span>
                    {money(
                      order.shippingAmount
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Tax
                  </span>

                  <span>
                    {money(
                      order.taxAmount
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>

                    <span>
                      {money(
                        order.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Order Information
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Order Date
                  </span>

                  <span className="text-right text-slate-800">
                    {dateTime(
                      order.createdAt
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Order Status
                  </span>

                  <span>
                    <Badge
                      type={getOrderType(
                        order.status
                      )}
                    >
                      {order.status}
                    </Badge>
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Fulfillment
                  </span>

                  <span>
                    <Badge
                      type={getFulfillmentType(
                        order.fulfillmentStatus
                      )}
                    >
                      {
                        order.fulfillmentStatus
                      }
                    </Badge>
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FulfillmentDetails;