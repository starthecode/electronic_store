import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

import {
  getFulfillmentOrders,
  getFulfillmentSummary,
} from "../../services/fulfillment.service";

const STATUS_OPTIONS = [
  ["", "Fulfillment Status"],
  ["UNFULFILLED", "Unfulfilled"],
  [
    "PARTIALLY_FULFILLED",
    "Partially Fulfilled",
  ],
  ["FULFILLED", "Fulfilled"],
];

const ORDER_STATUS_OPTIONS = [
  ["", "Order Status"],
  ["PENDING", "Pending"],
  ["CONFIRMED", "Confirmed"],
  ["PROCESSING", "Processing"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
  [
    "RETURN_REQUESTED",
    "Return Requested",
  ],
  ["RETURNED", "Returned"],
  ["REFUNDED", "Refunded"],
];

const formatMoney = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

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

const getFulfillmentLabel = (status) => {
  const labels = {
    UNFULFILLED: "Unfulfilled",
    PARTIALLY_FULFILLED:
      "Partially Fulfilled",
    FULFILLED: "Fulfilled",
  };

  return labels[status] || status;
};

const getOrderStatusLabel = (status) => {
  return status
    ? status
        .toLowerCase()
        .split("_")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ")
    : "—";
};

const FulfillmentBadge = ({
  status,
}) => {
  const styles = {
    UNFULFILLED:
      "bg-slate-100 text-slate-700",
    PARTIALLY_FULFILLED:
      "bg-amber-50 text-amber-700",
    FULFILLED:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {getFulfillmentLabel(status)}
    </span>
  );
};

const OrderBadge = ({ status }) => {
  const styles = {
    PENDING:
      "bg-amber-50 text-amber-700",
    CONFIRMED:
      "bg-blue-50 text-blue-700",
    PROCESSING:
      "bg-indigo-50 text-indigo-700",
    SHIPPED:
      "bg-purple-50 text-purple-700",
    DELIVERED:
      "bg-emerald-50 text-emerald-700",
    CANCELLED:
      "bg-red-50 text-red-700",
    RETURN_REQUESTED:
      "bg-orange-50 text-orange-700",
    RETURNED:
      "bg-slate-100 text-slate-700",
    REFUNDED:
      "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const styles = {
    PAID:
      "bg-emerald-50 text-emerald-700",
    PENDING:
      "bg-amber-50 text-amber-700",
    AUTHORIZED:
      "bg-blue-50 text-blue-700",
    FAILED:
      "bg-red-50 text-red-700",
    REFUNDED:
      "bg-slate-100 text-slate-700",
    PARTIALLY_REFUNDED:
      "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {status
        ? status
            .toLowerCase()
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
            )
            .join(" ")
        : "—"}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  loading,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {loading ? "—" : value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Icon
            size={19}
            className="text-slate-600"
          />
        </div>
      </div>
    </div>
  );
};

const Fulfillment = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const [summary, setSummary] = useState({
    totalOrders: 0,
    unfulfilled: 0,
    partiallyFulfilled: 0,
    fulfilled: 0,
  });

  const [search, setSearch] =
    useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [fulfillmentStatus, setFulfillmentStatus] =
    useState("");

  const [orderStatus, setOrderStatus] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState("desc");

  const [loading, setLoading] =
    useState(true);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }, [
    debouncedSearch,
    fulfillmentStatus,
    orderStatus,
    sortOrder,
  ]);

  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getFulfillmentOrders({
            page: pagination.page,
            limit: pagination.limit,
            search:
              debouncedSearch || undefined,
            fulfillmentStatus:
              fulfillmentStatus || undefined,
            orderStatus:
              orderStatus || undefined,
            sortBy: "createdAt",
            sortOrder,
          });

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to fetch fulfillment orders"
          );
        }

        setOrders(
          response.data?.orders || []
        );

        setPagination(
          response.data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch fulfillment orders"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      debouncedSearch,
      fulfillmentStatus,
      orderStatus,
      sortOrder,
    ]
  );

  const fetchSummary = useCallback(
    async () => {
      try {
        setSummaryLoading(true);

        const response =
          await getFulfillmentSummary();

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to fetch fulfillment summary"
          );
        }

        setSummary(
          response.data || {
            totalOrders: 0,
            unfulfilled: 0,
            partiallyFulfilled: 0,
            fulfilled: 0,
          }
        );
      } catch (err) {
        console.error(
          "Fulfillment summary error:",
          err
        );
      } finally {
        setSummaryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = async () => {
    await Promise.all([
      fetchOrders(true),
      fetchSummary(),
    ]);
  };

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page,
    }));
  };

  const pages = useMemo(() => {
    const total = pagination.totalPages;

    if (total <= 1) return [1];

    const start = Math.max(
      1,
      pagination.page - 2
    );

    const end = Math.min(
      total,
      pagination.page + 2
    );

    return Array.from(
      {
        length: end - start + 1,
      },
      (_, index) => start + index
    );
  }, [
    pagination.page,
    pagination.totalPages,
  ]);

  return (
    <div className="min-h-full bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              Fulfillment
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage stock reservation,
              fulfillment and returns.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={summary.totalOrders}
            description="All orders"
            icon={PackageCheck}
            loading={summaryLoading}
          />

          <StatCard
            title="Unfulfilled"
            value={summary.unfulfilled}
            description="Awaiting fulfillment"
            icon={Clock3}
            loading={summaryLoading}
          />

          <StatCard
            title="Partially Fulfilled"
            value={
              summary.partiallyFulfilled
            }
            description="Partially processed"
            icon={Truck}
            loading={summaryLoading}
          />

          <StatCard
            title="Fulfilled"
            value={summary.fulfilled}
            description="Stock fully fulfilled"
            icon={CheckCircle2}
            loading={summaryLoading}
          />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search order number, customer or email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <select
              value={fulfillmentStatus}
              onChange={(event) =>
                setFulfillmentStatus(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-slate-400"
            >
              {STATUS_OPTIONS.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              value={orderStatus}
              onChange={(event) =>
                setOrderStatus(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-slate-400"
            >
              {ORDER_STATUS_OPTIONS.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-slate-400"
            >
              <option value="desc">
                Newest
              </option>
              <option value="asc">
                Oldest
              </option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  {[
                    "ORDER",
                    "CUSTOMER",
                    "ITEMS",
                    "TOTAL",
                    "PAYMENT",
                    "FULFILLMENT",
                    "STATUS",
                    "DATE",
                    "ACTION",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-xs font-medium tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from(
                    { length: 6 },
                    (_, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100"
                      >
                        {Array.from(
                          { length: 9 },
                          (_, cell) => (
                            <td
                              key={cell}
                              className="px-5 py-5"
                            >
                              <div className="h-4 animate-pulse rounded bg-slate-100" />
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-24 text-center"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <PackageCheck
                          size={24}
                          className="text-slate-400"
                        />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-slate-900">
                        No fulfillment orders
                        found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        There are no matching
                        orders to display.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {order.orderNumber}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {order.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {customerName(
                            order.user
                          )}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {order.user?.email ||
                            "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {order.items?.length || 0}{" "}
                        {order.items?.length === 1
                          ? "item"
                          : "items"}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        {formatMoney(
                          order.totalAmount
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <PaymentBadge
                          status={
                            order.paymentStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <FulfillmentBadge
                          status={
                            order.fulfillmentStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <OrderBadge
                          status={order.status}
                        />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(
                          order.createdAt
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <a
                          href={`/admin/fulfillment/${order.id}`}
                          className="text-sm font-medium text-slate-900 hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            orders.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {Math.min(
                      (pagination.page - 1) *
                        pagination.limit +
                        1,
                      pagination.total
                    )}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-700">
                    {Math.min(
                      pagination.page *
                        pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {pagination.total}
                  </span>
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={
                      pagination.page === 1
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.page - 1
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {pages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        handlePageChange(page)
                      }
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm ${
                        page ===
                        pagination.page
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={
                      pagination.page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.page + 1
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Fulfillment;