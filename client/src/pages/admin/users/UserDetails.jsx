import {
  ArrowLeft,
  CalendarDays,
  Edit,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";

import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  deleteAdminUser,
  getAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../../services/adminUser.service";

import {
  getRoles,
} from "../../../services/role.service";

import UserStatusBadge from "../../../components/users/UserStatusBadge";

export default function UserDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [user, setUser] =
    useState(null);

  const [roles, setRoles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState(
      location.state?.message || ""
    );

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [userResponse, rolesResponse] =
        await Promise.all([
          getAdminUser(id),
          getRoles(),
        ]);

      if (!userResponse.success) {
        throw new Error(
          userResponse.message
        );
      }

      setUser(
        userResponse.data
      );

      setRoles(
        rolesResponse.data || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load user"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (
    status
  ) => {
    if (!user) return;

    try {
      setSaving(true);
      setError("");

      const response =
        await updateAdminUserStatus(
          user.id,
          status
        );

      if (!response.success) {
        throw new Error(
          response.message
        );
      }

      setUser(response.data);

      setNotice(
        "User status updated successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update status"
      );
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (
    roleId
  ) => {
    if (!user || roleId === user.roleId) {
      return;
    }

    const role = roles.find(
      (item) =>
        item.id === roleId
    );

    const confirmed =
      window.confirm(
        `Change ${user.email}'s role to ${formatRoleName(
          role?.name
        )}?`
      );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const response =
        await updateAdminUserRole(
          user.id,
          roleId
        );

      if (!response.success) {
        throw new Error(
          response.message
        );
      }

      setUser(response.data);

      setNotice(
        "User role updated successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update role"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmed =
      window.confirm(
        `Delete "${user.email}"? This action cannot be undone.`
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response =
        await deleteAdminUser(
          user.id
        );

      if (!response.success) {
        throw new Error(
          response.message
        );
      }

      navigate("/admin/users");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete user"
      );
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2
          size={24}
          className="animate-spin text-gray-400"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <button
          onClick={() =>
            navigate("/admin/users")
          }
          className="inline-flex items-center gap-2 text-sm text-gray-500"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ||
            "User not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            navigate("/admin/users")
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        <button
          type="button"
          onClick={load}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-600">
              {`${user.firstName?.[0] || ""}${
                user.lastName?.[0] || ""
              }`.toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  {user.firstName}{" "}
                  {user.lastName || ""}
                </h1>

                <UserStatusBadge
                  status={user.status}
                />
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/users/${user.id}/edit`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Account Information">
          <Info
            label="First Name"
            value={user.firstName}
          />

          <Info
            label="Last Name"
            value={
              user.lastName || "—"
            }
          />

          <Info
            label="Email"
            value={user.email}
          />

          <Info
            label="Phone"
            value={
              user.phone || "—"
            }
          />

          <Info
            label="Created"
            value={formatDate(
              user.createdAt
            )}
          />
        </Section>

        <Section title="Access & Security">
          <div className="mb-5">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
              Role
            </label>

            <select
              value={user.roleId}
              onChange={(e) =>
                changeRole(
                  e.target.value
                )
              }
              disabled={saving}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-900"
            >
              {roles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {formatRoleName(
                    role.name
                  )}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">
              Status
            </label>

            <select
              value={user.status}
              onChange={(e) =>
                changeStatus(
                  e.target.value
                )
              }
              disabled={saving}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-900"
            >
              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

              <option value="SUSPENDED">
                Suspended
              </option>
            </select>
          </div>

          <Info
            label="Role Description"
            value={
              user.role?.description ||
              "—"
            }
          />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-gray-900">
        {title}
      </h2>

      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-sm text-gray-800">
        {value}
      </span>
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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}