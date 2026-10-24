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
  ExternalLink,
  Loader2,
  Mail,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  getPayment,
  updatePaymentStatus,
} from "../../../services/payment.service";

const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const formatStatus = (status) => {
  if (!status) return "—";

  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

const formatMethod = (method) => {
  if (!method) return "—";

  if (method === "COD") {
    return "Cash on Delivery";
  }

  if (method === "UPI") {
    return "UPI";
  }

  if (method === "NET_BANKING") {
    return "Net Banking";
  }

  return formatStatus(method);
};

const formatCurrency = (value, currency = "INR") => {
  const safeCurrency = currency || "INR";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${safeCurrency} ${Number(
      value || 0
    ).toFixed(2)}`;
  }
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
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "AUTHORIZED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "REFUNDED":
      return "border-slate-200 bg-slate-100 text-slate-700";

    case "PARTIALLY_REFUNDED":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
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
  children,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={16} />
          </div>
        )}

        <h2 className="text-sm font-semibold text-slate-900">
          {title}
        </h2>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
};

const DetailRow = ({
  label,
  value,
  mono = false,
}) => {
  return (
    <div className="flex items-start justify-between gap-5 py-2.5">
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

const Skeleton = () => {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />

        <div className="h-8 w-72 animate-pulse rounded bg-slate-100" />

        <div className="h-4 w-52 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>

        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
};

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] = useState("");

  const [actionError, setActionError] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [confirmAction, setConfirmAction] =
    useState(null);

  const fetchPayment = useCallback(
    async (showRefresh = false) => {
      if (!id) {
        setError("Payment ID is missing.");
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

        const response =
          await getPayment(id);

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to fetch payment"
          );
        }

        setPayment(
          response?.data || null
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load payment."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const customerName = useMemo(() => {
    if (!payment?.order?.user) {
      return "Guest Customer";
    }

    const user =
      payment.order.user;

    const name = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      name ||
      user.email ||
      "Guest Customer"
    );
  }, [payment]);

  const updateStatus = async (
    nextStatus
  ) => {
    if (!payment) return;

    try {
      setUpdating(true);
      setActionError("");

      const response =
        await updatePaymentStatus(
          payment.id,
          nextStatus
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update payment status"
        );
      }

      setMenuOpen(false);
      setConfirmAction(null);

      await fetchPayment(true);
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

  const requestStatusChange = (
    nextStatus
  ) => {
    if (!payment) return;

    if (
      nextStatus === payment.status
    ) {
      return;
    }

    const destructiveStatuses = [
      "FAILED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ];

    if (
      destructiveStatuses.includes(
        nextStatus
      )
    ) {
      setConfirmAction({
        status: nextStatus,
        title: `Change payment to ${formatStatus(
          nextStatus
        )}?`,
        description:
          nextStatus === "REFUNDED"
            ? "This will mark the payment as refunded and clear its paid timestamp."
            : nextStatus ===
              "PARTIALLY_REFUNDED"
            ? "This will mark the payment as partially refunded."
            : "This will mark the payment as failed.",
      });

      return;
    }

    updateStatus(nextStatus);
  };

  if (loading) {
    return <Skeleton />;
  }

  if (error || !payment) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/payments")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium ui-btn-outline"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-900">
                Unable to load payment
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error ||
                  "The requested payment could not be found."}
              </p>

              <button
                type="button"
                onClick={() =>
                  fetchPayment()
                }
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-medium text-white hover:bg-red-800 ui-btn-danger"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const order = payment.order;
  const user = order?.user;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/admin/payments")
            }
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium transition ui-btn-outline"
          >
            <ArrowLeft size={16} />
            Back to Payments
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Payment Details
            </h1>

            <StatusBadge
              status={payment.status}
            />
          </div>

          <p className="mt-1.5 text-sm text-slate-500">
            Created on{" "}
            <span className="font-medium text-slate-700">
              {formatDateTime(
                payment.createdAt
              )}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchPayment(true)
          }
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ui-btn-outline"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
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
            onClick={() =>
              setActionError("")
            }
            className="text-red-500 hover:text-red-700 ui-btn-danger"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 xl:col-span-2">
          {/* Payment overview */}
          <SectionCard
            title="Payment Information"
            icon={CreditCard}
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
              <DetailRow
                label="Payment ID"
                value={payment.id}
                mono
              />

              <DetailRow
                label="Order Number"
                value={
                  order?.orderNumber ||
                  "—"
                }
              />

              <DetailRow
                label="Payment Method"
                value={formatMethod(
                  payment.method
                )}
              />

              <DetailRow
                label="Payment Status"
                value={
                  <StatusBadge
                    status={
                      payment.status
                    }
                  />
                }
              />

              <DetailRow
                label="Amount"
                value={formatCurrency(
                  payment.amount,
                  payment.currency
                )}
              />

              <DetailRow
                label="Currency"
                value={
                  payment.currency ||
                  "INR"
                }
              />

              <DetailRow
                label="Gateway"
                value={
                  payment.gateway ||
                  "—"
                }
              />

              <DetailRow
                label="Transaction ID"
                value={
                  payment.transactionId ||
                  "—"
                }
                mono
              />

              <DetailRow
                label="Created At"
                value={formatDateTime(
                  payment.createdAt
                )}
              />

              <DetailRow
                label="Paid At"
                value={
                  payment.paidAt
                    ? formatDateTime(
                        payment.paidAt
                      )
                    : "—"
                }
              />
            </div>
          </SectionCard>

          {/* Order */}
          <SectionCard
            title="Related Order"
            icon={Package}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Order
                  </p>

                  {order?.id ? (
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-slate-900 hover:text-slate-600"
                    >
                      {order.orderNumber ||
                        "View Order"}

                      <ExternalLink
                        size={14}
                      />
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Order unavailable
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    status={
                      order?.status
                    }
                  />

                  <StatusBadge
                    status={
                      order?.paymentStatus
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-400">
                    Order Total
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(
                      order?.totalAmount,
                      payment.currency
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Order Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={
                        order?.status
                      }
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Fulfillment
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={
                        order?.fulfillmentStatus
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Gateway response */}
          <SectionCard
            title="Gateway Response"
            icon={Clock3}
          >
            {payment.gatewayResponse ? (
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200">
                {typeof payment.gatewayResponse ===
                "string"
                  ? payment.gatewayResponse
                  : JSON.stringify(
                      payment.gatewayResponse,
                      null,
                      2
                    )}
              </pre>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No gateway response is
                  available for this payment.
                </p>
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
              {user?.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ui-btn-outline"
                >
                  <Mail
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <span className="min-w-0 truncate">
                    {user.email}
                  </span>
                </a>
              )}

              {user?.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ui-btn-outline"
                >
                  <Phone
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <span>
                    {user.phone}
                  </span>
                </a>
              )}
            </div>
          </SectionCard>

          {/* Status update */}
          <SectionCard
            title="Payment Status"
            icon={CreditCard}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Current Status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={payment.status}
                  />
                </div>
              </div>
            </div>

            <div className="relative mt-5 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    (value) => !value
                  )
                }
                disabled={updating}
                className="flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ui-btn-outline"
              >
                Change payment status
                <ChevronDown size={15} />
              </button>

              {menuOpen && (
                <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {PAYMENT_STATUSES.map(
                    (nextStatus) => {
                      const current =
                        nextStatus ===
                        payment.status;

                      return (
                        <button
                          type="button"
                          key={nextStatus}
                          disabled={current}
                          onClick={() =>
                            requestStatusChange(
                              nextStatus
                            )
                          }
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                        >
                          <span>
                            {formatStatus(
                              nextStatus
                            )}
                          </span>

                          {current ? (
                            <Check
                              size={15}
                              className="text-emerald-600"
                            />
                          ) : [
                              "FAILED",
                              "REFUNDED",
                              "PARTIALLY_REFUNDED",
                            ].includes(
                              nextStatus
                            ) ? (
                            <AlertCircle
                              size={14}
                              className="text-orange-500"
                            />
                          ) : null}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Status changes are recorded in the
              payment audit log.
            </p>
          </SectionCard>

          {/* Payment amount */}
          <SectionCard
            title="Amount"
            icon={CreditCard}
          >
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Payment Amount
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {formatCurrency(
                  payment.amount,
                  payment.currency
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {payment.currency ||
                  "INR"}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <DetailRow
                label="Payment Method"
                value={formatMethod(
                  payment.method
                )}
              />

              <DetailRow
                label="Gateway"
                value={
                  payment.gateway ||
                  "—"
                }
              />

              <DetailRow
                label="Transaction"
                value={
                  payment.transactionId ||
                  "—"
                }
                mono
              />
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
              !updating &&
              setConfirmAction(null)
            }
            className="absolute inset-0 ui-btn-outline"
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
                className="h-10 flex-1 rounded-xl border text-sm font-medium disabled:opacity-50 ui-btn-outline"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  updateStatus(
                    confirmAction.status
                  )
                }
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ui-btn-outline"
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

      {updating && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
            <Loader2
              size={16}
              className="animate-spin"
            />
            Updating payment...
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;