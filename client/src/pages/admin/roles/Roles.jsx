import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  KeyRound,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getRoles,
  deleteRole,
} from "../../../services/role.service";

import RoleStatusBadge from "../../../components/roles/RoleStatusBadge";

const formatRoleName = (name = "") =>
  name
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

const Roles = () => {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState(null);
  const [error, setError] = useState("");

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRoles();

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to fetch roles"
        );
      }

      setRoles(response.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch roles"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const filteredRoles = roles.filter(
    (role) => {
      const value =
        search.toLowerCase();

      return (
        role.name
          .toLowerCase()
          .includes(value) ||
        role.description
          ?.toLowerCase()
          .includes(value)
      );
    }
  );

  const handleDelete = async (role) => {
    if (
      !window.confirm(
        `Delete role "${formatRoleName(
          role.name
        )}"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(role.id);

      await deleteRole(role.id);

      await loadRoles();
    } catch (err) {
      window.alert(
        err?.response?.data?.message ||
          "Unable to delete role"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck size={16} />
              <span>Administration</span>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Roles & Permissions
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage administrator roles and
              their access permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadRoles}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 ui-btn-outline"
            >
              <RefreshCw
                size={16}
                className={
                  loading
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
                  "/admin/roles/create"
                )
              }
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm ui-btn-primary"
            >
              <Plus size={17} />
              Add Role
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-xl">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search roles..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredRoles.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm">
              <ShieldCheck
                size={40}
                className="mx-auto mb-3 text-gray-300"
              />

              <h3 className="font-medium text-gray-900">
                No administrator roles found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create a role to assign
                permissions to administrators.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/roles/create"
                  )
                }
                className="mt-5 rounded-xl px-4 py-2.5 text-sm font-medium ui-btn-primary"
              >
                Create Role
              </button>
            </div>
          )}

        {/* Table */}
        {(loading ||
          filteredRoles.length > 0) && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left">
                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Role
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Type
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Users
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Permissions
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({
                      length: 4,
                    }).map((_, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100"
                      >
                        <td
                          colSpan="5"
                          className="px-6 py-6"
                        >
                          <div className="h-5 animate-pulse rounded bg-gray-100" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredRoles.map(
                      (role) => (
                        <tr
                          key={role.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                                <ShieldCheck
                                  size={19}
                                  className="text-gray-500"
                                />
                              </div>

                              <div>
                                <div className="font-medium text-gray-900">
                                  {formatRoleName(
                                    role.name
                                  )}
                                </div>

                                {role.description && (
                                  <div className="mt-0.5 max-w-md text-xs text-gray-400">
                                    {
                                      role.description
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <RoleStatusBadge
                              role={role}
                            />
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Users
                                size={16}
                                className="text-gray-400"
                              />

                              {role._count
                                ?.users ??
                                0}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <KeyRound
                                size={16}
                                className="text-gray-400"
                              />

                              {role._count
                                ?.permissions ??
                                0}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                title="View role"
                                onClick={() =>
                                  navigate(
                                    `/admin/roles/${role.id}`
                                  )
                                }
                                className="rounded-lg p-2 ui-btn-outline"
                              >
                                <Eye
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                title="Edit role"
                                onClick={() =>
                                  navigate(
                                    `/admin/roles/${role.id}/edit`
                                  )
                                }
                                className="rounded-lg p-2 ui-btn-outline"
                              >
                                <Pencil
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                title="Delete role"
                                disabled={
                                  deletingId ===
                                  role.id
                                }
                                onClick={() =>
                                  handleDelete(
                                    role
                                  )
                                }
                                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 ui-btn-danger"
                              >
                                <Trash2
                                  size={17}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <div className="border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
                Showing {filteredRoles.length}{" "}
                role
                {filteredRoles.length !== 1
                  ? "s"
                  : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;