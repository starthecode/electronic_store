import {
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteAdminUser,
  getAdminUsers,
} from "../../../services/adminUser.service";

import {
  getRoles,
} from "../../../services/role.service";

import UserStatusBadge from "../../../components/users/UserStatusBadge";
import UserFilters from "../../../components/users/UserFilters";

export default function Users() {
  const navigate = useNavigate();

  const [users, setUsers] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [roleId, setRoleId] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const loadRoles = async () => {
    try {
      const response =
        await getRoles();

      if (response.success) {
        setRoles(
          response.data || []
        );
      }
    } catch {
      // User loading remains independent.
    }
  };

  const loadUsers = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await getAdminUsers({
          page,
          limit: 20,
          search:
            debouncedSearch || undefined,
          status:
            status || undefined,
          roleId:
            roleId || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load users"
        );
      }

      setUsers(
        response.data?.users || []
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
          "Failed to load users"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [
    page,
    debouncedSearch,
    status,
    roleId,
  ]);

  const handleDelete = async (user) => {
    const confirmed =
      window.confirm(
        `Delete admin user "${user.email}"? This action cannot be undone.`
      );

    if (!confirmed) return;

    try {
      const response =
        await deleteAdminUser(
          user.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to delete user"
        );
      }

      await loadUsers(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete user"
      );
    }
  };

  const activeCount = useMemo(
    () =>
      users.filter(
        (user) =>
          user.status === "ACTIVE"
      ).length,
    [users]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
            <Shield size={15} />
            Administration
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage administrator accounts and access roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              loadUsers(true)
            }
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm disabled:opacity-50 ui-btn-outline"
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
              navigate(
                "/admin/users/new"
              )
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm ui-btn-primary"
          >
            <Plus size={17} />
            Add User
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<UserRound size={18} />}
          label="Total Users"
          value={pagination.total}
        />

        <SummaryCard
          icon={<Shield size={18} />}
          label="Active on Page"
          value={activeCount}
        />

        <SummaryCard
          icon={<Shield size={18} />}
          label="Roles"
          value={roles.length}
        />
      </div>

      <UserFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={(value) => {
          setStatus(value);
          setPage(1);
        }}
        roleId={roleId}
        setRoleId={(value) => {
          setRoleId(value);
          setPage(1);
        }}
        roles={roles}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <EmptyState
            onAdd={() =>
              navigate(
                "/admin/users/new"
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Phone
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {user.firstName}{" "}
                              {user.lastName || ""}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {formatRoleName(
                            user.role?.name
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <UserStatusBadge
                          status={user.status}
                        />
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            title="View"
                            onClick={() =>
                              navigate(
                                `/admin/users/${user.id}`
                              )
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Edit"
                            onClick={() =>
                              navigate(
                                `/admin/users/${user.id}/edit`
                              )
                            }
                          >
                            <Edit size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Delete"
                            danger
                            onClick={() =>
                              handleDelete(
                                user
                              )
                            }
                          >
                            <Trash2
                              size={16}
                            />
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
              setPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        {icon}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Avatar({ user }) {
  const initials = `${user.firstName?.[0] || ""}${
    user.lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
      {initials || "U"}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  danger,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition${
        danger
          ? "text-gray-400 hover:bg-red-50 hover:text-red-600 ui-btn-danger"
          : "text-gray-400 hover:bg-orange-50 hover:text-orange-700 ui-btn-outline"
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({
  pagination,
  setPage,
}) {
  if (pagination.totalPages <= 1) {
    return (
      <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
        Showing {pagination.total} users
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
      <p className="text-sm text-gray-500">
        Page {pagination.page} of{" "}
        {pagination.totalPages}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() =>
            setPage(
              pagination.page - 1
            )
          }
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ui-btn-outline"
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
            setPage(
              pagination.page + 1
            )
          }
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ui-btn-outline"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function formatRoleName(name = "") {
  return name
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}

function EmptyState({ onAdd }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <UserRound size={22} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900">
        No users found
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Try changing your filters or create a new administrator.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ui-btn-primary"
      >
        <Plus size={15} />
        Add User
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-50" />

      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-8 border-t border-gray-100 px-5 py-5"
          >
            <div className="h-10 w-10 rounded-full bg-gray-100" />

            <div className="h-3 w-48 rounded bg-gray-100" />

            <div className="h-3 w-28 rounded bg-gray-100" />

            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        )
      )}
    </div>
  );
}