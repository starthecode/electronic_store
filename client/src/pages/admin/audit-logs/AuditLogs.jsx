import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAuditLogs,
} from "../../../services/auditLog.service";

import AuditLogActionBadge from "../../../components/auditLogs/AuditLogActionBadge";
import AuditLogFilters from "../../../components/auditLogs/AuditLogFilters";

const INITIAL_FILTERS = {
  search: "",
  action: "",
  entity: "",
  from: "",
  to: "",
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getUserName = (user) => {
  if (!user) return "System";

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || user.email || "System";
};

const getInitials = (user) => {
  if (!user) return "S";

  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";

  return (
    `${first}${last}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U"
  );
};

const AuditLogs = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(
    async (page = pagination.page) => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: 20,
          sortOrder: "desc",
        };

        if (filters.search.trim()) {
          params.search = filters.search.trim();
        }

        if (filters.action) {
          params.action = filters.action;
        }

        if (filters.entity.trim()) {
          params.entity = filters.entity.trim();
        }

        if (filters.from) {
          params.from = new Date(
            `${filters.from}T00:00:00`
          ).toISOString();
        }

        if (filters.to) {
          // Include the complete selected day.
          params.to = new Date(
            `${filters.to}T23:59:59.999`
          ).toISOString();
        }

        const response = await getAuditLogs(params);

        setLogs(response.data?.logs || []);

        setPagination(
          response.data?.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        console.error(
          "Failed to fetch audit logs:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to load audit logs."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [filters, fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="min-h-full bg-gray-50 p-5 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <FileText size={16} />
              <span>Administration</span>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track important administrative and system activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchLogs(pagination.page)
            }
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-5">
          <AuditLogFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Activity
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Entity
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Performed By
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map(
                    (_, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100"
                      >
                        <td className="px-5 py-5">
                          <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
                        </td>

                        <td className="px-5 py-5">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                        </td>

                        <td className="px-5 py-5">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>

                        <td className="px-5 py-5">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                        </td>

                        <td className="px-5 py-5">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                        </td>

                        <td className="px-5 py-5">
                          <div className="ml-auto h-8 w-8 animate-pulse rounded bg-gray-100" />
                        </td>
                      </tr>
                    )
                  )
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                        <FileText
                          size={22}
                          className="text-gray-400"
                        />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-gray-900">
                        No audit logs found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your filters or search terms.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/60"
                    >
                      {/* Description */}
                      <td className="max-w-[360px] px-5 py-4">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {log.description ||
                            "No description"}
                        </div>

                        {log.entityId && (
                          <div className="mt-1 truncate font-mono text-xs text-gray-400">
                            {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <AuditLogActionBadge
                          action={log.action}
                        />
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-700">
                          {log.entity || "—"}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {getInitials(log.user)}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900">
                              {getUserName(log.user)}
                            </div>

                            {log.user?.email && (
                              <div className="truncate text-xs text-gray-400">
                                {log.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {formatDateTime(
                          log.createdAt
                        )}
                      </td>

                      {/* View */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/audit-logs/${log.id}`
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                          title="View audit log"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && logs.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {logs.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {pagination.total}
                </span>{" "}
                audit logs
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    fetchLogs(
                      pagination.page - 1
                    )
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-500">
                  Page {pagination.page} of{" "}
                  {Math.max(
                    pagination.totalPages,
                    1
                  )}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    fetchLogs(
                      pagination.page + 1
                    )
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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

export default AuditLogs;