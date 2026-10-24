import { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  deleteSetting,
  getSettings,
} from "../../../services/setting.service";

import SettingCategoryBadge from "../../../components/settings/SettingCategoryBadge";
import SettingValue from "../../../components/settings/SettingValue";

const categories = [
  "GENERAL",
  "STORE",
  "CURRENCY",
  "TAX",
  "SHIPPING",
  "ORDERS",
  "INVENTORY",
  "PAYMENTS",
  "AFFILIATE",
  "NOTIFICATIONS",
  "SYSTEM",
];

const Settings = () => {
  const navigate = useNavigate();

  const [settings, setSettings] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [deletingKey, setDeletingKey] =
    useState(null);

  const loadSettings = async (
    page = 1
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getSettings({
          page,
          limit: 20,
          search:
            search.trim() || undefined,
          category:
            category || undefined,
        });

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to fetch settings"
        );
      }

      setSettings(
        response.data?.settings || []
      );

      setPagination(
        response.data?.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSettings(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category]);

  const handleDelete = async (
    setting
  ) => {
    const confirmed =
      window.confirm(
        `Delete setting "${setting.key}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingKey(setting.key);

      await deleteSetting(setting.key);

      await loadSettings(
        settings.length === 1 &&
          pagination.page > 1
          ? pagination.page - 1
          : pagination.page
      );
    } catch (err) {
      window.alert(
        err?.response?.data?.message ||
          "Unable to delete setting"
      );
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <SettingsIcon size={16} />
              Administration
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage system and store configuration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                loadSettings(
                  pagination.page
                )
              }
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
                  "/admin/settings/create"
                )
              }
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm ui-btn-primary"
            >
              <Plus size={17} />
              Add Setting
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search setting key or description..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-400"
              />
            </div>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-400"
            >
              <option value="">
                All Categories
              </option>

              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item
                      .toLowerCase()
                      .replace(
                        /_/g,
                        " "
                      )
                      .replace(
                        /\b\w/g,
                        (char) =>
                          char.toUpperCase()
                      )}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-left">
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Setting
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Value
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Category
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Description
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100"
                    >
                      <td
                        colSpan="5"
                        className="px-6 py-5"
                      >
                        <div className="h-5 animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : settings.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >
                      <SettingsIcon
                        size={38}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <h3 className="font-medium text-gray-900">
                        No settings found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Create a setting or
                        change your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  settings.map(
                    (setting) => (
                      <tr
                        key={setting.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <div className="font-medium text-gray-900">
                              {setting.key}
                            </div>

                            {setting.isSensitive && (
                              <div className="mt-1 text-xs text-orange-600">
                                Sensitive
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="max-w-xs px-6 py-5">
                          <SettingValue
                            setting={
                              setting
                            }
                          />
                        </td>

                        <td className="px-6 py-5">
                          <SettingCategoryBadge
                            category={
                              setting.category
                            }
                          />
                        </td>

                        <td className="max-w-sm px-6 py-5">
                          <span className="block truncate text-sm text-gray-500">
                            {setting.description ||
                              "—"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="View setting"
                              onClick={() =>
                                navigate(
                                  `/admin/settings/${encodeURIComponent(
                                    setting.key
                                  )}`
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
                              title="Edit setting"
                              onClick={() =>
                                navigate(
                                  `/admin/settings/${encodeURIComponent(
                                    setting.key
                                  )}/edit`
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
                              title="Delete setting"
                              disabled={
                                deletingKey ===
                                setting.key
                              }
                              onClick={() =>
                                handleDelete(
                                  setting
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

          {!loading &&
            settings.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  {settings.length} of{" "}
                  {pagination.total}{" "}
                  settings
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      pagination.page <= 1
                    }
                    onClick={() =>
                      loadSettings(
                        pagination.page -
                          1
                      )
                    }
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ui-btn-outline"
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
                      loadSettings(
                        pagination.page +
                          1
                      )
                    }
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ui-btn-outline"
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

export default Settings;