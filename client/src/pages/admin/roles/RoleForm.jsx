import { useEffect, useState } from "react";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createRole,
  getRole,
  updateRole,
} from "../../../services/role.service";

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        setLoading(true);

        const response =
          await getRole(id);

        if (!response.success) {
          throw new Error(
            response.message ||
              "Failed to load role"
          );
        }

        const role = response.data;

        setForm({
          name: role.name || "",
          description:
            role.description || "",
        });
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

    load();
  }, [id, isEdit]);

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name
          .trim()
          .toUpperCase(),
        description:
          form.description.trim() ||
          undefined,
      };

      const response = isEdit
        ? await updateRole(id, payload)
        : await createRole(payload);

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to save role"
        );
      }

      navigate(
        isEdit
          ? `/admin/roles/${id}`
          : `/admin/roles/${response.data.id}`
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save role"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl animate-pulse rounded-2xl border border-gray-200 bg-white p-8">
          <div className="mb-6 h-6 w-40 rounded bg-gray-100" />
          <div className="mb-4 h-11 rounded bg-gray-100" />
          <div className="h-28 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/roles")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Roles
        </button>

        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck size={16} />
            Administration
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            {isEdit
              ? "Edit Role"
              : "Create Role"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Update administrator role information."
              : "Create a role for administrator access control."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="space-y-6 p-6">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Role Name *
              </label>

              <input
                value={form.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value
                  )
                }
                placeholder="e.g. STORE_MANAGER"
                required
                maxLength={100}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase outline-none focus:border-gray-400"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Use uppercase letters, numbers
                and underscores.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe what this role is responsible for..."
                maxLength={255}
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/roles")
              }
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;