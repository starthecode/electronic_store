import {
  Eye,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(amount);
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const statusClass = (status) => {
  if (
    ["DELIVERED", "PAID"].includes(status)
  ) {
    return "bg-emerald-50 text-emerald-600 border-emerald-200";
  }

  if (
    ["CANCELLED", "FAILED", "REFUNDED"].includes(
      status
    )
  ) {
    return "bg-red-50 text-red-600 border-red-200";
  }

  return "bg-blue-50 text-blue-600 border-blue-200";
};

const CustomerOrders = ({
  orders,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <Loader2
          size={20}
          className="animate-spin"
        />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="py-10 text-center">
        <ShoppingCart
          size={28}
          className="mx-auto text-gray-300"
        />

        <p className="mt-2 text-sm font-medium text-gray-600">
          No orders found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[800px] w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Order
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Date
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Amount
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Payment
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-400">
              Status
            </th>

            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-400">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-gray-50"
            >
              <td className="px-4 py-4">
                <p className="text-sm font-medium text-gray-900">
                  {order.orderNumber ||
                    order.id}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {order.items?.length || 0} item
                  {order.items?.length === 1
                    ? ""
                    : "s"}
                </p>
              </td>

              <td className="px-4 py-4 text-sm text-gray-600">
                {formatDate(
                  order.createdAt
                )}
              </td>

              <td className="px-4 py-4 text-sm font-medium text-gray-900">
                {formatCurrency(
                  order.totalAmount
                )}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                    order.payment?.status ||
                      order.paymentStatus
                  )}`}
                >
                  {order.payment?.status ||
                    order.paymentStatus ||
                    "PENDING"}
                </span>
              </td>

              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>

              <td className="px-4 py-4 text-right">
                <Link
                  to={`/admin/orders/${order.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg ui-btn-outline"
                  title="View order"
                >
                  <Eye size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerOrders;