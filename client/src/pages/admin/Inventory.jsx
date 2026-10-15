import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import {
  getInventoryList,
  getInventorySummary
} from "../../services/inventory.service";

import InventoryAdjustModal from "../../components/admin/InventoryAdjustModal";
import InventoryTransactionsModal from "../../components/admin/InventoryTransactionsModal";

const Inventory = () => {
  const [inventories, setInventories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [summary, setSummary] = useState({
  totalStock: 0,
  totalReserved: 0,
  totalAvailable: 0,
  lowStockProducts: 0,
});

  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adjustInventoryItem, setAdjustInventoryItem] =
    useState(null);

  const [historyInventory, setHistoryInventory] =
    useState(null);

const loadInventory = async (
  page = pagination.page
) => {
  try {
    setLoading(true);
    setError("");

    const [listResponse, summaryResponse] =
      await Promise.all([
        getInventoryList({
          page,
          limit: pagination.limit,
          search: search.trim() || undefined,
          lowStock: lowStock || undefined,
        }),

        getInventorySummary(),
      ]);

    const listData = listResponse.data;
    const summaryData = summaryResponse.data;

    setInventories(listData?.inventories ?? []);

    setPagination(
      listData?.pagination ?? {
        page,
        limit: pagination.limit,
        total: 0,
        totalPages: 0,
      }
    );

    setSummary({
      totalStock: summaryData?.totalStock ?? 0,
      totalReserved: summaryData?.totalReserved ?? 0,
      totalAvailable: summaryData?.totalAvailable ?? 0,
      lowStockProducts:
        summaryData?.lowStockProducts ?? 0,
    });
  } catch (err) {
    console.error(err);

    setError(
      err?.response?.data?.message ||
        "Failed to load inventory."
    );
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    loadInventory(1);
  }, [search, lowStock]);

  const handleAdjustmentSuccess = () => {
    loadInventory(pagination.page);
  };
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product stock and inventory movements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadInventory(pagination.page)}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Stock"
          value={summary.totalStock}
          icon={<Package size={20} />}
        />

        <SummaryCard
          title="Reserved"
          value={summary.totalReserved}
          icon={<SlidersHorizontal size={20} />}
        />

        <SummaryCard
          title="Available"
          value={summary.totalAvailable}
          icon={<Package size={20} />}
        />

        <SummaryCard
          title="Low Stock"
          value={summary.lowStockProducts}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, variant or SKU..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) =>
                setLowStock(e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />

            <AlertTriangle size={16} />

            Low stock only
          </label>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2
                size={30}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : inventories.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-500">
              No inventory records found.
            </div>
          ) : (
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Variant
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    SKU
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Stock
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Reserved
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Available
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Reorder Level
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {inventories.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.variant.product.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.variant.product.brand?.name ||
                            "No brand"}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.variant.name || "-"}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-gray-600">
                      {item.variant.sku}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.reservedQuantity}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          item.isLowStock
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.availableQuantity}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.reorderLevel}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Adjust stock"
                          onClick={() =>
                            setAdjustInventoryItem(item)
                          }
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Settings size={17} />
                        </button>

                        <button
                          type="button"
                          title="Transaction history"
                          onClick={() =>
                            setHistoryInventory(item)
                          }
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <History size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading &&
          inventories.length > 0 && (
            <div className="flex items-center justify-between border-t px-5 py-4">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {(pagination.page - 1) *
                    pagination.limit +
                    1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-700">
                  {Math.min(
                    pagination.page *
                      pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {pagination.total}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    loadInventory(
                      pagination.page - 1
                    )
                  }
                  className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="px-2 text-sm text-gray-600">
                  {pagination.page} /{" "}
                  {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    loadInventory(
                      pagination.page + 1
                    )
                  }
                  className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
      </div>

      {adjustInventoryItem && (
        <InventoryAdjustModal
          inventory={adjustInventoryItem}
          onClose={() =>
            setAdjustInventoryItem(null)
          }
          onSuccess={handleAdjustmentSuccess}
        />
      )}

      {historyInventory && (
        <InventoryTransactionsModal
          inventory={historyInventory}
          onClose={() =>
            setHistoryInventory(null)
          }
        />
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-orange-50 p-3 text-orange-500">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Inventory;