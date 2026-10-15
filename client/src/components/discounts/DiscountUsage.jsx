import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  getDiscountUsage,
} from "../../services/discount.service";

export default function DiscountUsage({
  discount,
}) {
  const [usages, setUsages] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadUsage = async (
    page = pagination.page
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDiscountUsage(
          discount.id,
          {
            page,
            limit: 20,
          }
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load discount usage"
        );
      }

      setUsages(
        response.data?.usages || []
      );

      setPagination(
        response.data?.pagination || {
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
          "Failed to load discount usage"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage(1);
  }, [discount.id]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Usage History
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Customers who have used this discount.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <UsageSkeleton />
      ) : usages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <Users size={22} />
          </div>

          <h4 className="mt-3 text-sm font-semibold text-gray-900">
            No usage yet
          </h4>

          <p className="mt-1 text-sm text-gray-500">
            This discount has not been used by any customer.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Email
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Used At
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {usages.map((usage) => {
                    const user =
                      usage.user || {};

                    const fullName = [
                      user.firstName,
                      user.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr
                        key={usage.id}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                              <Users
                                size={16}
                              />
                            </div>

                            <span className="text-sm font-medium text-gray-900">
                              {fullName ||
                                "Customer"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {user.email ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarDays
                              size={15}
                              className="text-gray-400"
                            />

                            {formatDate(
                              usage.usedAt
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages >
            1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    loadUsage(
                      pagination.page -
                        1
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    loadUsage(
                      pagination.page +
                        1
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

function UsageSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200">
      <div className="h-12 bg-gray-50" />

      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-8 border-t border-gray-100 px-5 py-4"
          >
            <div className="h-9 w-9 rounded-full bg-gray-100" />

            <div className="h-3 w-40 rounded bg-gray-100" />

            <div className="h-3 w-48 rounded bg-gray-100" />

            <div className="h-3 w-32 rounded bg-gray-100" />
          </div>
        )
      )}
    </div>
  );
}