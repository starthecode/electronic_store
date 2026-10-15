import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  getInventoryTransactions,
} from "../../services/inventory.service";

const InventoryTransactionsModal = ({
  inventory,
  onClose,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);

        const response = await getInventoryTransactions(
          inventory.variant.product.id,
          inventory.variant.id,
          {
            page: 1,
            limit: 50,
          }
        );

        setTransactions(response.data?.transactions ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [inventory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Inventory History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {inventory.variant.product.name} ·{" "}
              {inventory.variant.name || inventory.variant.sku}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                size={28}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No inventory transactions found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-600">
                    Type
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Quantity
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Reference
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Note
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {transaction.type}
                      </span>
                    </td>

                    <td
                      className={`px-6 py-4 font-semibold ${
                        transaction.quantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.quantity > 0 ? "+" : ""}
                      {transaction.quantity}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {transaction.reference || "-"}
                    </td>

                    <td className="max-w-xs truncate px-6 py-4 text-gray-600">
                      {transaction.note || "-"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {new Date(
                        transaction.createdAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryTransactionsModal;