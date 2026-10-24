import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  getPayments,
  getPaymentSummary,
} from "../../../services/payment.service";

const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const PAYMENT_METHODS = [
  "COD",
  "CARD",
  "UPI",
  "NET_BANKING",
  "WALLET",
  "OTHER",
];

const SORT_OPTIONS = [
  {
    label: "Newest",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    label: "Oldest",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    label: "Highest Amount",
    sortBy: "amount",
    sortOrder: "desc",
  },
  {
    label: "Lowest Amount",
    sortBy: "amount",
    sortOrder: "asc",
  },
  {
    label: "Status A-Z",
    sortBy: "status",
    sortOrder: "asc",
  },
  {
    label: "Status Z-A",
    sortBy: "status",
    sortOrder: "desc",
  },
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

  if (method === "COD") return "Cash on Delivery";

  if (method === "UPI") return "UPI";

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

const getCustomerName = (user) => {
  if (!user) return "Guest Customer";

  const name = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Guest Customer";
};

const getInitials = (user) => {
  if (!user) return "CU";

  const first =
    user.firstName?.charAt(0) || "";

  const last =
    user.lastName?.charAt(0) || "";

  return (
    `${first}${last}`.toUpperCase() || "CU"
  );
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
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusClasses(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  loading,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
          )}

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
};

const TableSkeleton = () => {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />

              <div className="space-y-2">
                <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-5 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [method, setMethod] = useState("");

  const [sortBy, setSortBy] =
    useState("createdAt");

  const [sortOrder, setSortOrder] =
    useState("desc");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const [summary, setSummary] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    authorizedPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    partiallyRefundedPayments: 0,
  });

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const fetchPaymentSummary = useCallback(
    async () => {
      try {
        setSummaryLoading(true);

        const response =
          await getPaymentSummary();

        if (!response?.success) {
          throw new Error(
            response?.message ||
            "Failed to fetch payment summary"
          );
        }

        setSummary(
          response?.data || {
            totalPayments: 0,
            pendingPayments: 0,
            authorizedPayments: 0,
            paidPayments: 0,
            failedPayments: 0,
            refundedPayments: 0,
            partiallyRefundedPayments: 0,
          }
        );
      } catch (err) {
        console.error(
          "Failed to fetch payment summary:",
          err
        );
      } finally {
        setSummaryLoading(false);
      }
    },
    []
  );

  const fetchPayments = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getPayments({
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
          method: method || undefined,
          sortBy,
          sortOrder,
        });

        if (!response?.success) {
          throw new Error(
            response?.message ||
            "Failed to fetch payments"
          );
        }

        setPayments(
          response?.data?.payments || []
        );

        setPagination(
          response?.data?.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load payments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      status,
      method,
      sortBy,
      sortOrder,
    ]
  );

  useEffect(() => {
    fetchPayments();
    fetchPaymentSummary();
  }, [
    fetchPayments,
    fetchPaymentSummary,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch =
        searchInput.trim();

      if (nextSearch !== search) {
        setPage(1);
        setSearch(nextSearch);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setMethod("");
    setPage(1);
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchPayments(true),
      fetchPaymentSummary(),
    ]);
  };

  const handleSortChange = (event) => {
    const selected = SORT_OPTIONS.find(
      (item) =>
        item.label === event.target.value
    );

    if (!selected) return;

    setSortBy(selected.sortBy);
    setSortOrder(selected.sortOrder);
    setPage(1);
  };

  const hasFilters = useMemo(() => {
    return Boolean(
      search || status || method
    );
  }, [search, status, method]);

  const selectedSortLabel =
    SORT_OPTIONS.find(
      (item) =>
        item.sortBy === sortBy &&
        item.sortOrder === sortOrder
    )?.label || "Newest";


  const goToPage = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === page
    ) {
      return;
    }

    setPage(nextPage);
  };

  const getPageNumbers = () => {
    const totalPages =
      pagination.totalPages;

    if (!totalPages || totalPages <= 1) {
      return [];
    }

    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages = [1];

    if (page > 4) {
      pages.push("...");
    }

    const start = Math.max(2, page - 1);

    const end = Math.min(
      totalPages - 1,
      page + 1
    );

    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }

    if (page < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem =
    pagination.total === 0
      ? 0
      : (page - 1) *
      pagination.limit +
      1;

  const endItem =
    pagination.total === 0
      ? 0
      : Math.min(
        page * pagination.limit,
        pagination.total
      );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor payment transactions and
            payment status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Unable to load payments
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchPayments(true)
            }
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 ui-btn-danger"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Payments"
          value={summary.totalPayments}
          icon={CreditCard}
          description="All payment transactions"
          loading={summaryLoading}
        />

        <StatCard
          title="Paid"
          value={summary.paidPayments}
          icon={CheckCircle2}
          description="Successfully paid"
          loading={summaryLoading}
        />

        <StatCard
          title="Pending"
          value={summary.pendingPayments}
          icon={Clock3}
          description="Awaiting payment"
          loading={summaryLoading}
        />

        <StatCard
          title="Failed"
          value={summary.failedPayments}
          icon={XCircle}
          description="Payment failures"
          loading={summaryLoading}
        />

        <StatCard
          title="Refunded"
          value={
            summary.refundedPayments +
            summary.partiallyRefundedPayments
          }
          icon={RotateCcw}
          description="Refunded or partially refunded"
          loading={summaryLoading}
        />
      </div>
      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 lg:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search transaction, order number or customer email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 ui-btn-outline"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Desktop filters */}
            <div className="hidden gap-3 lg:flex">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="h-11 min-w-[155px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="">
                  Payment Status
                </option>

                {PAYMENT_STATUSES.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {formatStatus(item)}
                    </option>
                  )
                )}
              </select>

              <select
                value={method}
                onChange={(event) => {
                  setMethod(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="h-11 min-w-[155px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="">
                  Payment Method
                </option>

                {PAYMENT_METHODS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {formatMethod(item)}
                    </option>
                  )
                )}
              </select>

              <select
                value={selectedSortLabel}
                onChange={handleSortChange}
                className="h-11 min-w-[150px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                {SORT_OPTIONS.map(
                  (item) => (
                    <option
                      key={item.label}
                      value={item.label}
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Mobile filter */}
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(true)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium lg:hidden ui-btn-outline"
            >
              <Filter size={16} />
              Filters

              {hasFilters && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                  !
                </span>
              )}
            </button>
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-500">
                Active filters:
              </span>

              {search && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  Search: {search}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  Status:{" "}
                  {formatStatus(status)}
                </span>
              )}

              {method && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  Method:{" "}
                  {formatMethod(method)}
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-xs font-medium underline underline-offset-2 ui-btn-outline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Order
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Method
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton />
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <CreditCard size={24} />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-slate-900">
                        No payments found
                      </h3>

                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {hasFilters
                          ? "Try changing your search or filters."
                          : "There are no payment transactions to display yet."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-4 rounded-lg px-4 py-2 text-xs font-medium ui-btn-outline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const customer =
                    payment.order?.user;

                  const customerName =
                    getCustomerName(customer);

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/payments/${payment.id}`}
                          className="font-mono text-xs font-semibold text-slate-900 hover:text-slate-600"
                        >
                          {payment.id.slice(
                            0,
                            8
                          )}
                          ...
                        </Link>

                        <p className="mt-1 max-w-[170px] truncate font-mono text-[11px] text-slate-400">
                          {payment.transactionId ||
                            "No transaction ID"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {getInitials(
                              customer
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[190px] truncate text-sm font-medium text-slate-900">
                              {customerName}
                            </p>

                            <p className="mt-0.5 max-w-[190px] truncate text-xs text-slate-500">
                              {customer?.email ||
                                "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {payment.order ? (
                          <Link
                            to={`/admin/orders/${payment.order.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-slate-600"
                          >
                            {payment.order
                              .orderNumber ||
                              "View Order"}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-700">
                          {formatMethod(
                            payment.method
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(
                            payment.amount,
                            payment.currency
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            payment.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm text-slate-600">
                            {formatDate(
                              payment.createdAt
                            )}
                          </span>

                          {payment.paidAt && (
                            <p className="mt-1 text-xs text-emerald-600">
                              Paid{" "}
                              {formatDate(
                                payment.paidAt
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/payments/${payment.id}`}
                          title="View payment"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ui-btn-outline"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading &&
          pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {startItem}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {endItem}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {pagination.total}
                </span>{" "}
                payments
              </p>

              {pagination.totalPages >
                1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(page - 1)
                      }
                      disabled={page <= 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {pageNumbers.map(
                      (pageNumber, index) =>
                        pageNumber === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={pageNumber}
                            onClick={() =>
                              goToPage(
                                pageNumber
                              )
                            }
                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium${pageNumber === page
                              ? "ui-btn-primary"
                              : "border ui-btn-outline"
                              }`}
                          >
                            {pageNumber}
                          </button>
                        )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(page + 1)
                      }
                      disabled={
                        page >=
                        pagination.totalPages
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
            </div>
          )}
      </div>

      {/* Mobile filters */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            className="absolute inset-0 ui-btn-outline"
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Filters
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Refine payment transactions
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg ui-btn-outline"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Payment Status
                </label>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">
                    All statuses
                  </option>

                  {PAYMENT_STATUSES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {formatStatus(item)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Payment Method
                </label>

                <select
                  value={method}
                  onChange={(event) => {
                    setMethod(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">
                    All methods
                  </option>

                  {PAYMENT_METHODS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {formatMethod(item)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Sort
                </label>

                <select
                  value={selectedSortLabel}
                  onChange={handleSortChange}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  {SORT_OPTIONS.map(
                    (item) => (
                      <option
                        key={item.label}
                        value={item.label}
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 flex-1 rounded-xl border text-sm font-medium ui-btn-outline"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="h-11 flex-1 rounded-xl text-sm font-medium ui-btn-outline"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;