import { Link } from "react-router-dom";
import { getOrders } from "../../services/customer.service";
import { useEffect, useState } from "react";

const formatMoney = (value, currency = "INR") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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

const Orders = () => {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getOrders()
      .then((data) => {
        if (!mounted) return;

        setOrders(Array.isArray(data) ? data : data?.orders || []);
      })
      .catch((error) => {
        if (!mounted) return;

        setError(error.message || "Unable to load your orders");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/account"
          className="text-sm text-gray-500 transition hover:text-black"
        >
          ← My account
        </Link>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            My orders
          </h1>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!orders && !error && (
          <div className="mt-8 space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-white" />
            <div className="h-28 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {orders && orders.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-lg font-medium">
              You haven't placed any orders yet.
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your orders will appear here after you complete checkout.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Start shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {order.orderNumber}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                      {" · "}
                      {statusLabel(order.status)}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                      {order.items?.length || order._count?.items || 0} item(s)
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-medium">
                    {formatMoney(
                      order.totalAmount,
                      order.currency || "INR"
                    )}
                  </p>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <span className="text-sm font-medium text-gray-600">
                    View order →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Orders;