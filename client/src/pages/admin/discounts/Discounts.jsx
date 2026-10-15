import {
  Copy,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Tag,
  Users,
  Package,
  Layers3,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteDiscount,
  getDiscounts,
} from "../../../services/discount.service";

import DiscountFilters from "../../../components/discounts/DiscountFilters";
import DiscountStatusBadge from "../../../components/discounts/DiscountStatusBadge";

const PAGE_SIZE = 20;

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDiscountValue = (discount) => {
  if (discount.type === "PERCENTAGE") {
    return `${Number(discount.value)}%`;
  }

  return formatMoney(discount.value);
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export default function Discounts() {
  const navigate = useNavigate();

  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    scope: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const loadDiscounts = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getDiscounts({
          page: pagination.page,
          limit: PAGE_SIZE,
          ...(filters.search.trim()
            ? {
                search: filters.search.trim(),
              }
            : {}),
          ...(filters.type
            ? { type: filters.type }
            : {}),
          ...(filters.scope
            ? { scope: filters.scope }
            : {}),
          ...(filters.status
            ? { status: filters.status }
            : {}),
        });

        if (!response.success) {
          throw new Error(
            response.message ||
              "Failed to load discounts"
          );
        }

        setDiscounts(
          response.data?.discounts || []
        );

        setPagination(
          response.data?.pagination || {
            page: 1,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load discounts"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      filters.search,
      filters.type,
      filters.scope,
      filters.status,
      pagination.page,
    ]
  );

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleFilterChange = (changes) => {
    setFilters((current) => ({
      ...current,
      ...changes,
    }));

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      type: "",
      scope: "",
      status: "",
    });

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

const handleDelete = async (discount) => {
  const confirmed = window.confirm(
    `Delete discount "${discount.name}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    setDeleteId(discount.id);

    await deleteDiscount(discount.id);

    if (
      discounts.length === 1 &&
      pagination.page > 1
    ) {
      setPagination((current) => ({
        ...current,
        page: current.page - 1,
      }));
    } else {
      await loadDiscounts();
    }
  } catch (err) {
    window.alert(
      err?.response?.data?.message ||
        err?.message ||
        "Unable to delete discount"
    );
  } finally {
    setDeleteId(null);
  }
};

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  };

  const getUsageText = (discount) => {
    const used = Number(discount.usageCount || 0);

    if (discount.usageLimit) {
      return `${used} / ${discount.usageLimit}`;
    }

    return `${used}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Tag size={16} />
            Marketing
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Discounts
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage promotional discount codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadDiscounts(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
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

          <button
            type="button"
            onClick={() =>
              navigate("/admin/discounts/new")
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-black"
          >
            <Plus size={17} />
            Add Discount
          </button>
        </div>
      </div>

      {/* Filters */}
      <DiscountFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <DiscountTableSkeleton />
        ) : discounts.length === 0 ? (
          <EmptyState
            hasFilters={
              filters.search ||
              filters.type ||
              filters.scope ||
              filters.status
            }
            onCreate={() =>
              navigate("/admin/discounts/new")
            }
            onClear={handleClearFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Discount
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Value
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Scope
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Usage
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Validity
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {discounts.map((discount) => (
                    <tr
                      key={discount.id}
                      className="transition hover:bg-gray-50/60"
                    >
                      {/* Discount */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                            <Tag size={18} />
                          </div>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/admin/discounts/${discount.id}`
                                )
                              }
                              className="block max-w-[300px] truncate text-sm font-semibold text-gray-900 hover:underline"
                            >
                              {discount.name}
                            </button>

                            <div className="mt-1 flex items-center gap-1.5">
                              <code className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                                {discount.code}
                              </code>

                              <button
                                type="button"
                                title="Copy code"
                                onClick={() =>
                                  copyCode(
                                    discount.code
                                  )
                                }
                                className="text-gray-400 hover:text-gray-900"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDiscountValue(
                            discount
                          )}
                        </div>

                        {discount.minimumAmount !=
                          null && (
                          <div className="mt-1 text-xs text-gray-500">
                            Min.{" "}
                            {formatMoney(
                              discount.minimumAmount
                            )}
                          </div>
                        )}
                      </td>

                      {/* Scope */}
                      <td className="px-6 py-4">
                        <ScopeBadge
                          scope={discount.scope}
                        />

                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          {Number(
                            discount._count
                              ?.products || 0
                          ) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Package size={13} />
                              {
                                discount._count
                                  .products
                              }
                            </span>
                          )}

                          {Number(
                            discount._count
                              ?.categories || 0
                          ) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Layers3 size={13} />
                              {
                                discount._count
                                  .categories
                              }
                            </span>
                          )}

                          {discount.scope ===
                            "ORDER" && (
                            <span>
                              Entire order
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
                          <Users
                            size={15}
                            className="text-gray-400"
                          />
                          {getUsageText(
                            discount
                          )}
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {formatDate(
                            discount.startsAt
                          )}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          to{" "}
                          {discount.expiresAt
                            ? formatDate(
                                discount.expiresAt
                              )
                            : "No expiry"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <DiscountStatusBadge
                          status={
                            discount.status
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            title="View"
                            onClick={() =>
                              navigate(
                                `/admin/discounts/${discount.id}`
                              )
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Edit"
                            onClick={() =>
                              navigate(
                                `/admin/discounts/${discount.id}/edit`
                              )
                            }
                          >
                            <Edit size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Delete"
                            danger
                            disabled={
                              deleteId ===
                              discount.id
                            }
                            onClick={() =>
                              handleDelete(
                                discount
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={pagination}
              onPageChange={(page) =>
                setPagination((current) => ({
                  ...current,
                  page,
                }))
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

function ScopeBadge({ scope }) {
  const config = {
    ORDER: {
      label: "Order",
      className:
        "bg-blue-50 text-blue-700",
    },
    PRODUCT: {
      label: "Product",
      className:
        "bg-violet-50 text-violet-700",
    },
    CATEGORY: {
      label: "Category",
      className:
        "bg-orange-50 text-orange-700",
    },
  };

  const item =
    config[scope] || config.ORDER;

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-gray-400 hover:bg-red-50 hover:text-red-600"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({
  pagination,
  onPageChange,
}) {
  if (pagination.totalPages <= 1) {
    return (
      <div className="border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
        Showing {pagination.total} discount
        {pagination.total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
      <p className="text-sm text-gray-500">
        Page {pagination.page} of{" "}
        {pagination.totalPages} ·{" "}
        {pagination.total} total
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() =>
            onPageChange(
              pagination.page - 1
            )
          }
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={
            pagination.page >=
            pagination.totalPages
          }
          onClick={() =>
            onPageChange(
              pagination.page + 1
            )
          }
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
  onClear,
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        {hasFilters ? (
          <Search size={24} />
        ) : (
          <Tag size={24} />
        )}
      </div>

      <h3 className="text-base font-semibold text-gray-900">
        {hasFilters
          ? "No discounts found"
          : "No discounts yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {hasFilters
          ? "Try changing your filters or search term."
          : "Create your first discount code to start offering promotions."}
      </p>

      <div className="mt-5">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        ) : (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
          >
            <Plus size={16} />
            Add Discount
          </button>
        )}
      </div>
    </div>
  );
}

function DiscountTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 border-b border-gray-100 bg-gray-50" />

      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-gray-100 px-6 py-5"
          >
            <div className="h-10 w-10 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 rounded bg-gray-100" />
              <div className="h-2.5 w-28 rounded bg-gray-100" />
            </div>
            <div className="h-8 w-20 rounded bg-gray-100" />
            <div className="h-8 w-24 rounded bg-gray-100" />
            <div className="h-8 w-20 rounded bg-gray-100" />
            <div className="h-8 w-24 rounded bg-gray-100" />
          </div>
        )
      )}
    </div>
  );
}