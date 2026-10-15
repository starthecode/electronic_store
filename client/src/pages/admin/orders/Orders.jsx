import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { getOrders } from "../../../services/order.service";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

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
    label: "Highest Total",
    sortBy: "totalAmount",
    sortOrder: "desc",
  },
  {
    label: "Lowest Total",
    sortBy: "totalAmount",
    sortOrder: "asc",
  },
  {
    label: "Order Number A-Z",
    sortBy: "orderNumber",
    sortOrder: "asc",
  },
  {
    label: "Order Number Z-A",
    sortBy: "orderNumber",
    sortOrder: "desc",
  },
];

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

const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "CU";
};

const getCustomerName = (user) => {
  if (!user) return "Guest Customer";

  const name = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || "Guest Customer";
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

          {description && (
            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>
          )}
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
            <div className="h-4 w-8 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          </td>

          <td className="px-5 py-4">
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getOrders({
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          fulfillmentStatus:
            fulfillmentStatus || undefined,
          sortBy,
          sortOrder,
        });

        if (!response?.success) {
          throw new Error(
            response?.message || "Failed to fetch orders"
          );
        }

        setOrders(response?.data?.orders || []);

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
            "Failed to load orders."
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
      paymentStatus,
      fulfillmentStatus,
      sortBy,
      sortOrder,
    ]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchInput.trim();

      if (nextSearch !== search) {
        setPage(1);
        setSearch(nextSearch);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const hasFilters = useMemo(() => {
    return Boolean(
      search ||
        status ||
        paymentStatus ||
        fulfillmentStatus
    );
  }, [
    search,
    status,
    paymentStatus,
    fulfillmentStatus,
  ]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setFulfillmentStatus("");
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handlePaymentFilterChange = (value) => {
    setPaymentStatus(value);
    setPage(1);
  };

  const handleFulfillmentFilterChange = (value) => {
    setFulfillmentStatus(value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    const selected = SORT_OPTIONS.find(
      (item) => item.label === event.target.value
    );

    if (!selected) return;

    setSortBy(selected.sortBy);
    setSortOrder(selected.sortOrder);
    setPage(1);
  };

  const selectedSortLabel =
    SORT_OPTIONS.find(
      (item) =>
        item.sortBy === sortBy &&
        item.sortOrder === sortOrder
    )?.label || "Newest";

  const visibleStats = useMemo(() => {
    const total = pagination.total || 0;

    const pending = orders.filter(
      (order) => order.status === "PENDING"
    ).length;

    const processing = orders.filter(
      (order) => order.status === "PROCESSING"
    ).length;

    const shipped = orders.filter(
      (order) => order.status === "SHIPPED"
    ).length;

    const cancelledReturned = orders.filter((order) =>
      ["CANCELLED", "RETURNED", "REFUNDED"].includes(
        order.status
      )
    ).length;

    return {
      total,
      pending,
      processing,
      shipped,
      cancelledReturned,
    };
  }, [orders, pagination.total]);

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
    const totalPages = pagination.totalPages;

    if (!totalPages || totalPages <= 1) {
      return [];
    }

    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (page > 4) {
      pages.push("...");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
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
      : (page - 1) * pagination.limit + 1;

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
            Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and track customer orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
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
              Unable to load orders
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Orders"
          value={visibleStats.total}
          icon={ShoppingBag}
          description="All matching orders"
          loading={loading}
        />

        <StatCard
          title="Pending"
          value={visibleStats.pending}
          icon={RotateCcw}
          description="On current page"
          loading={loading}
        />

        <StatCard
          title="Processing"
          value={visibleStats.processing}
          icon={Package}
          description="On current page"
          loading={loading}
        />

        <StatCard
          title="Shipped"
          value={visibleStats.shipped}
          icon={Truck}
          description="On current page"
          loading={loading}
        />

        <StatCard
          title="Cancelled / Returned"
          value={visibleStats.cancelledReturned}
          icon={AlertCircle}
          description="On current page"
          loading={loading}
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
                  setSearchInput(event.target.value)
                }
                placeholder="Search order number, customer or email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Desktop filters */}
            <div className="hidden gap-3 lg:flex">
              <select
                value={status}
                onChange={(event) =>
                  handleStatusFilterChange(
                    event.target.value
                  )
                }
                className="h-11 min-w-[155px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="">Order Status</option>

                {ORDER_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {formatStatus(item)}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatus}
                onChange={(event) =>
                  handlePaymentFilterChange(
                    event.target.value
                  )
                }
                className="h-11 min-w-[155px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="">Payment Status</option>

                {PAYMENT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {formatStatus(item)}
                  </option>
                ))}
              </select>

              <select
                value={fulfillmentStatus}
                onChange={(event) =>
                  handleFulfillmentFilterChange(
                    event.target.value
                  )
                }
                className="h-11 min-w-[165px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                <option value="">
                  Fulfillment Status
                </option>

                {FULFILLMENT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {formatStatus(item)}
                  </option>
                ))}
              </select>

              <select
                value={selectedSortLabel}
                onChange={handleSortChange}
                className="h-11 min-w-[145px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                {SORT_OPTIONS.map((item) => (
                  <option
                    key={item.label}
                    value={item.label}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(true)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 lg:hidden"
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
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  Search: {search}
                </span>
              )}

              {status && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  {formatStatus(status)}
                </span>
              )}

              {paymentStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  Payment: {formatStatus(paymentStatus)}
                </span>
              )}

              {fulfillmentStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  Fulfillment:{" "}
                  {formatStatus(fulfillmentStatus)}
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
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
                  Order
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Items
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fulfillment
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
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <ShoppingBag size={24} />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-slate-900">
                        No orders found
                      </h3>

                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {hasFilters
                          ? "Try changing your search or filters."
                          : "There are no orders to display yet."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customerName =
                    getCustomerName(order.user);

                  return (
                    <tr
                      key={order.id}
                      className="transition hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-semibold text-slate-900 hover:text-slate-600"
                        >
                          {order.orderNumber ||
                            `#${order.id}`}
                        </Link>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDateTime(
                            order.createdAt
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {getInitials(
                              order.user?.firstName,
                              order.user?.lastName
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {customerName}
                            </p>

                            <p className="mt-0.5 max-w-[190px] truncate text-xs text-slate-500">
                              {order.user?.email ||
                                "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {order?._count?.items ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(
                            order.totalAmount
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={order.paymentStatus}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            order.fulfillmentStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={order.status}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          title="View order"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
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
                orders
              </p>

              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      goToPage(page - 1)
                    }
                    disabled={page <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                            goToPage(pageNumber)
                          }
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                            pageNumber === page
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
                      page >= pagination.totalPages
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            className="absolute inset-0 bg-slate-900/40"
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Filters
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Refine your order list
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Order Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    handleStatusFilterChange(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">All statuses</option>

                  {ORDER_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Payment Status
                </label>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    handlePaymentFilterChange(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">All statuses</option>

                  {PAYMENT_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Fulfillment Status
                </label>

                <select
                  value={fulfillmentStatus}
                  onChange={(event) =>
                    handleFulfillmentFilterChange(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="">All statuses</option>

                  {FULFILLMENT_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
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
                  {SORT_OPTIONS.map((item) => (
                    <option
                      key={item.label}
                      value={item.label}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="h-11 flex-1 rounded-xl bg-slate-900 text-sm font-medium text-white"
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

export default Orders;