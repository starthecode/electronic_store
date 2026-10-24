import {
  Eye,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CustomerFilters from "../../../components/customers/CustomerFilters";
import CustomerStatusBadge from "../../../components/customers/CustomerStatusBadge";
import { getCustomers } from "../../../services/customer.service";

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

const getCustomerName = (customer) => {
  return [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadCustomers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getCustomers({
            page,
            limit: 20,
            search: search || undefined,
            status: status || undefined,
            sortBy: "createdAt",
            sortOrder: "desc",
          });

        const data = response?.data;

        setCustomers(
          data?.customers || []
        );

        setPagination(
          data?.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load customers."
        );
      } finally {
        setLoading(false);
      }
    },
    [search, status]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
  };

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <Users size={16} />
              Customers
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Customers
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage customer accounts and activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadCustomers(pagination.page)
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 ui-btn-outline"
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

        {/* Filters */}
        <CustomerFilters
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onReset={resetFilters}
        />

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Orders
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Addresses
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({
                        length: 7,
                      }).map((__, cell) => (
                        <td
                          key={cell}
                          className="px-6 py-5"
                        >
                          <div className="h-4 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <Users
                        size={32}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const name =
                      getCustomerName(
                        customer
                      );

                    return (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-gray-50/70"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                              {(
                                customer.firstName?.[0] ||
                                "C"
                              ).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {name || "Unnamed Customer"}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {customer.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-700">
                            {customer.email}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {customer.phone || "No phone"}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-700">
                          {customer._count?.orders ??
                            0}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-700">
                          {customer._count
                            ?.addresses ?? 0}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(
                            customer.createdAt
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <CustomerStatusBadge
                            status={
                              customer.status
                            }
                          />
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            to={`/admin/customers/${customer.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ui-btn-outline"
                            title="View customer"
                          >
                            <Eye size={17} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading &&
            customers.length > 0 && (
              <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  {customers.length} of{" "}
                  {pagination.total} customers
                </p>

                {pagination.totalPages >
                  1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        pagination.page <= 1
                      }
                      onClick={() =>
                        loadCustomers(
                          pagination.page - 1
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                    >
                      Previous
                    </button>

                    <span className="px-2 text-sm text-gray-500">
                      {pagination.page} /{" "}
                      {pagination.totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        pagination.page >=
                        pagination.totalPages
                      }
                      onClick={() =>
                        loadCustomers(
                          pagination.page + 1
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Customers;