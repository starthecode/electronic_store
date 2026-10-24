import {
  ArrowLeft,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  deleteRole,
  getRole,
} from "../../../services/role.service";

import {
    getPermissions,
  getRolePermissions,
  assignRolePermissions,
  removeRolePermission,
} from "../../../services/permission.service";

export default function RoleDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [role, setRole] =
    useState(null);

  const [permissions, setPermissions] =
    useState([]);

  const [assigned, setAssigned] =
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

  const [showPermissionModal, setShowPermissionModal] =
    useState(false);

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        roleResponse,
        permissionsResponse,
        assignedResponse,
      ] = await Promise.all([
        getRole(id),
        getPermissions(),
        getRolePermissions(id),
      ]);

      if (!roleResponse.success) {
        throw new Error(
          roleResponse.message
        );
      }

      if (!permissionsResponse.success) {
        throw new Error(
          permissionsResponse.message
        );
      }

      if (!assignedResponse.success) {
        throw new Error(
          assignedResponse.message
        );
      }

      setRole(
        roleResponse.data
      );

      setPermissions(
        permissionsResponse.data ||
          []
      );

      setAssigned(
        assignedResponse.data ||
          []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load role"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const assignedIds = useMemo(
    () =>
      new Set(
        assigned.map(
          (permission) =>
            permission.id
        )
      ),
    [assigned]
  );

  const groupedPermissions =
    useMemo(() => {
      const groups = {};

      permissions.forEach(
        (permission) => {
          const group =
            getPermissionGroup(
              permission.name
            );

          if (!groups[group]) {
            groups[group] = [];
          }

          groups[group].push(
            permission
          );
        }
      );

      return groups;
    }, [permissions]);

  const availablePermissions =
    permissions.filter(
      (permission) =>
        !assignedIds.has(
          permission.id
        )
    );

  const addPermissions = async () => {
    if (
      selectedPermissionIds.length ===
      0
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await assignRolePermissions(
          id,
          selectedPermissionIds
        );

      if (!response.success) {
        throw new Error(
          response.message
        );
      }

      setAssigned(
        response.data || []
      );

      setSelectedPermissionIds([]);
      setShowPermissionModal(false);

      setNotice(
        "Permissions assigned successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign permissions"
      );
    } finally {
      setSaving(false);
    }
  };

  const removePermission = async (
    permission
  ) => {
    const confirmed =
      window.confirm(
        `Remove "${permission.name}" from this role?`
      );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const response =
        await removeRolePermission(
          id,
          permission.id
        );

      if (!response.success) {
        throw new Error(
          response.message
        );
      }

      setAssigned((current) =>
        current.filter(
          (item) =>
            item.id !==
            permission.id
        )
      );

      setNotice(
        "Permission removed successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove permission"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!role) return;

    if (
      Number(role._count?.users || 0) >
      0
    ) {
      setError(
        "This role is assigned to users and cannot be deleted."
      );
      return;
    }

    if (
      !window.confirm(
        `Delete "${formatRoleName(
          role.name
        )}"?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await deleteRole(id);

      if (!response.success) {
        throw new Error(
          response.message
        );
      }

      navigate("/admin/roles");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete role"
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

  if (!role) {
    return (
      <div className="space-y-4">
        <button
          onClick={() =>
            navigate("/admin/roles")
          }
          className="inline-flex items-center gap-2 text-sm ui-btn-outline"
        >
          <ArrowLeft size={16} />
          Back to Roles
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ||
            "Role not found."}
        </div>
      </div>
    );
  }

  const canManagePermissions =
    role.name !== "SUPER_ADMIN" &&
    role.name !== "CUSTOMER";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            navigate("/admin/roles")
          }
          className="inline-flex items-center gap-2 text-sm font-medium ui-btn-outline"
        >
          <ArrowLeft size={16} />
          Back to Roles
        </button>

        <button
          onClick={load}
          className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium ui-btn-outline"
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

      {/* Role header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Shield size={23} />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {formatRoleName(
                  role.name
                )}
              </h1>

              <p className="mt-1 font-mono text-xs text-gray-400">
                {role.name}
              </p>

              {role.description && (
                <p className="mt-2 text-sm text-gray-500">
                  {role.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                navigate(
                  `/admin/roles/${id}/edit`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ui-btn-outline"
            >
              <Edit size={15} />
              Edit
            </button>

            <button
              onClick={handleDeleteRole}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 ui-btn-danger"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<Users size={18} />}
          label="Users"
          value={
            role._count?.users || 0
          }
        />

        <Stat
          icon={<Shield size={18} />}
          label="Permissions"
          value={assigned.length}
        />

        <Stat
          icon={<Shield size={18} />}
          label="Available"
          value={
            availablePermissions.length
          }
        />
      </div>

      {/* Permissions */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Permissions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage the permissions assigned to this role.
            </p>
          </div>

          {canManagePermissions && (
            <button
              type="button"
              onClick={() =>
                setShowPermissionModal(
                  true
                )
              }
              disabled={
                availablePermissions.length ===
                0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40 ui-btn-primary"
            >
              <Plus size={16} />
              Add Permissions
            </button>
          )}
        </div>

        {!canManagePermissions && (
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-700">
            This is a protected system role. Its permissions cannot be modified.
          </div>
        )}

        <div className="p-6">
          {assigned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
              <Shield
                size={22}
                className="mx-auto text-gray-400"
              />

              <h3 className="mt-3 text-sm font-semibold text-gray-900">
                No permissions assigned
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add permissions to define what this role can access.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                groupedPermissions
              ).map(
                ([group, groupPermissions]) => {
                  const active =
                    groupPermissions.filter(
                      (permission) =>
                        assignedIds.has(
                          permission.id
                        )
                    );

                  if (
                    active.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={group}
                    >
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {group}
                      </h3>

                      <div className="grid gap-3 md:grid-cols-2">
                        {active.map(
                          (
                            permission
                          ) => (
                            <div
                              key={
                                permission.id
                              }
                              className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </p>

                                {permission.description && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {
                                      permission.description
                                    }
                                  </p>
                                )}
                              </div>

                              {canManagePermissions && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removePermission(
                                      permission
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 ui-btn-danger"
                                  title="Remove permission"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {showPermissionModal && (
        <PermissionModal
          permissions={
            availablePermissions
          }
          selected={
            selectedPermissionIds
          }
          setSelected={
            setSelectedPermissionIds
          }
          onClose={() => {
            setShowPermissionModal(
              false
            );
            setSelectedPermissionIds(
              []
            );
          }}
          onSave={addPermissions}
          saving={saving}
        />
      )}
    </div>
  );
}

function PermissionModal({
  permissions,
  selected,
  setSelected,
  onClose,
  onSave,
  saving,
}) {
  const toggle = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  };

  const grouped = {};

  permissions.forEach(
    (permission) => {
      const group =
        getPermissionGroup(
          permission.name
        );

      if (!grouped[group]) {
        grouped[group] = [];
      }

      grouped[group].push(
        permission
      );
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Add Permissions
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {selected.length} selected
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg ui-btn-outline"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="space-y-7">
            {Object.entries(
              grouped
            ).map(
              ([group, groupPermissions]) => (
                <div key={group}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group}
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">
                    {groupPermissions.map(
                      (permission) => (
                        <label
                          key={
                            permission.id
                          }
                          className={`cursor-pointer rounded-xl border p-4 transition ${
                            selected.includes(
                              permission.id
                            )
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(
                                permission.id
                              )}
                              onChange={() =>
                                toggle(
                                  permission.id
                                )
                              }
                              className="mt-0.5 h-4 w-4 accent-black"
                            />

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {
                                  permission.name
                                }
                              </p>

                              {permission.description && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {
                                    permission.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium ui-btn-outline"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={
              saving ||
              selected.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40 ui-btn-primary"
          >
            {saving && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}
            Assign Selected
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
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

function getPermissionGroup(
  name = ""
) {
  const prefix =
    name.split(".")[0];

  const groups = {
    dashboard: "Dashboard",
    users: "Users",
    customers: "Customers",
    products: "Products",
    categories: "Categories",
    brands: "Brands",
    inventory: "Inventory",
    orders: "Orders",
    discounts: "Discounts",
    settings: "Settings",
    audit_logs: "Audit Logs",
    payments: "Payments",
    affiliate_reports: "Affiliate",
  };

  return (
    groups[prefix] ||
    "Other"
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