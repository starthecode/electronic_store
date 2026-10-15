import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";

import {
  getDashboardInventory,
  getDashboardOverview,
  getDashboardSales,
  getDashboardTopProducts,
} from "../../services/dashboard.service";

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [topProducts, setTopProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        overviewResponse,
        salesResponse,
        inventoryResponse,
        topProductsResponse,
      ] = await Promise.all([
        getDashboardOverview(),
        getDashboardSales(),
        getDashboardInventory(),
        getDashboardTopProducts({
          limit: 5,
        }),
      ]);

      setOverview(overviewResponse.data);
      setSales(salesResponse.data?.sales ?? []);
      setInventory(inventoryResponse.data);
      setTopProducts(
        topProductsResponse.data?.products ?? []
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN").format(
      Number(value || 0)
    );
  };

  const cards = [
    {
      title: "Total Sales",
      value: formatCurrency(overview?.totalSales),
      icon: BarChart3,
    },
    {
      title: "Total Orders",
      value: formatNumber(overview?.totalOrders),
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      value: formatNumber(overview?.totalCustomers),
      icon: Users,
    },
    {
      title: "Products",
      value: formatNumber(overview?.totalProducts),
      icon: Package,
    },
    {
      title: "Low Stock",
      value: formatNumber(overview?.lowStockProducts),
      icon: AlertTriangle,
    },
    {
      title: "Affiliate Clicks",
      value: formatNumber(overview?.affiliateClicks),
      icon: ClipboardList,
    },
  ];

  const maxSales = Math.max(
    ...sales.map((item) => Number(item.sales || 0)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your electronic store.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchDashboard}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {loading ? "—" : card.value}
                  </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales chart + Top products */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Sales */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Sales & Orders
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Daily sales performance
              </p>
            </div>

            <TrendingUp
              size={20}
              className="text-orange-500"
            />
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Loading sales...
              </div>
            ) : sales.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No sales data available
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((item) => {
                  const salesValue = Number(
                    item.sales || 0
                  );

                  const percentage =
                    (salesValue / maxSales) * 100;

                  return (
                    <div key={item.date}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {item.date}
                        </span>

                        <span className="font-medium text-gray-700">
                          {formatCurrency(salesValue)}
                          {" · "}
                          {formatNumber(item.orders)}{" "}
                          orders
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-all"
                          style={{
                            width: `${Math.max(
                              percentage,
                              salesValue > 0 ? 2 : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Top Products
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Best-selling products
              </p>
            </div>

            <Package
              size={20}
              className="text-orange-500"
            />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                Loading products...
              </div>
            ) : topProducts.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No product sales available
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topProducts.map((product, index) => (
                  <div
                    key={`${product.sku}-${index}`}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {product.productName}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {formatCurrency(
                          product.revenue
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatNumber(
                          product.quantitySold
                        )}{" "}
                        sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Inventory Overview
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Current inventory status
            </p>
          </div>

          <Warehouse
            size={20}
            className="text-orange-500"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <InventoryItem
            label="Total Variants"
            value={inventory?.totalVariants}
          />

          <InventoryItem
            label="In Stock"
            value={inventory?.inStockVariants}
          />

          <InventoryItem
            label="Out of Stock"
            value={inventory?.outOfStockVariants}
          />

          <InventoryItem
            label="Low Stock"
            value={inventory?.lowStockVariants}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Total Units
            </span>

            <span className="font-semibold text-gray-800">
              {loading
                ? "—"
                : formatNumber(
                    inventory?.totalUnits
                  )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Reserved Units
            </span>

            <span className="font-semibold text-gray-800">
              {loading
                ? "—"
                : formatNumber(
                    inventory?.totalReservedUnits
                  )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryItem = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900">
        {value ?? "—"}
      </p>
    </div>
  );
};

export default Dashboard;