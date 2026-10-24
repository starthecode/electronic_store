import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createSetting,
  getSetting,
  updateSetting,
} from "../../../services/setting.service";

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

const valueTypes = [
  "string",
  "number",
  "boolean",
  "json",
  "null",
];

const SettingForm = () => {
  const navigate = useNavigate();
  const { key } = useParams();

  const isEdit = Boolean(key);

  const [form, setForm] = useState({
    key: "",
    value: "",
    valueType: "string",
    category: "GENERAL",
    isSensitive: false,
    description: "",
  });

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);

  const [showSensitive, setShowSensitive] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getSetting(key);

        if (!response.success) {
          throw new Error(
            response.message ||
              "Failed to load setting"
          );
        }

        const setting =
          response.data;

        let valueType = "string";
        let value = "";

        if (setting.isSensitive) {
          /*
           * Sensitive values are intentionally
           * returned as null by the backend.
           */
          valueType = "string";
          value = "";
        } else if (
          setting.value === null
        ) {
          valueType = "null";
          value = "";
        } else if (
          typeof setting.value ===
          "boolean"
        ) {
          valueType = "boolean";
          value = setting.value
            ? "true"
            : "false";
        } else if (
          typeof setting.value ===
          "number"
        ) {
          valueType = "number";
          value = String(
            setting.value
          );
        } else if (
          typeof setting.value ===
          "object"
        ) {
          valueType = "json";
          value = JSON.stringify(
            setting.value,
            null,
            2
          );
        } else {
          valueType = "string";
          value = String(
            setting.value ?? ""
          );
        }

        setForm({
          key: setting.key || "",
          value,
          valueType,
          category:
            setting.category ||
            "GENERAL",
          isSensitive:
            Boolean(
              setting.isSensitive
            ),
          description:
            setting.description ||
            "",
        });
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load setting"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [key, isEdit]);

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const changeValueType = (
    type
  ) => {
    let value = "";

    if (type === "boolean") {
      value = "false";
    }

    setForm((current) => ({
      ...current,
      valueType: type,
      value,
    }));
  };

  const parseValue = () => {
    switch (form.valueType) {
      case "number": {
        const number =
          Number(form.value);

        if (
          form.value.trim() === "" ||
          !Number.isFinite(number)
        ) {
          throw new Error(
            "Please enter a valid number."
          );
        }

        return number;
      }

      case "boolean":
        return form.value ===
          "true";

      case "json": {
        if (
          !form.value.trim()
        ) {
          throw new Error(
            "Please enter valid JSON."
          );
        }

        try {
          return JSON.parse(
            form.value
          );
        } catch {
          throw new Error(
            "Invalid JSON value."
          );
        }
      }

      case "null":
        return null;

      case "string":
      default:
        return form.value;
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const value = parseValue();

      const payload = {
        value,
        category:
          form.category,
        isSensitive:
          form.isSensitive,
        description:
          form.description.trim() ||
          undefined,
      };

      if (!isEdit) {
        payload.key =
          form.key.trim();
      }

      const response = isEdit
        ? await updateSetting(
            key,
            payload
          )
        : await createSetting({
            ...payload,
            key: form.key.trim(),
          });

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to save setting"
        );
      }

      navigate("/admin/settings");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save setting"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl animate-pulse rounded-2xl border border-gray-200 bg-white p-8">
          <div className="mb-6 h-7 w-40 rounded bg-gray-100" />
          <div className="mb-4 h-11 rounded bg-gray-100" />
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
            navigate(
              "/admin/settings"
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm ui-btn-outline"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </button>

        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <SettingsIcon size={16} />
            Administration
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            {isEdit
              ? "Edit Setting"
              : "Create Setting"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Update configuration value and metadata."
              : "Create a new system or store configuration setting."}
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
            {/* Key */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Setting Key *
              </label>

              <input
                value={form.key}
                onChange={(e) =>
                  updateField(
                    "key",
                    e.target.value
                  )
                }
                disabled={isEdit}
                required
                maxLength={150}
                placeholder="store.name"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Letters, numbers, dots,
                underscores and hyphens only.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Category *
              </label>

              <select
                value={form.category}
                onChange={(e) =>
                  updateField(
                    "category",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400"
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category
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

            {/* Value type */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Value Type *
              </label>

              <select
                value={
                  form.valueType
                }
                onChange={(e) =>
                  changeValueType(
                    e.target.value
                  )
                }
                disabled={
                  isEdit &&
                  form.isSensitive
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400 disabled:bg-gray-50"
              >
                {valueTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type === "json"
                        ? "JSON / Array / Object"
                        : type
                            .charAt(0)
                            .toUpperCase() +
                          type.slice(1)}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Value *
              </label>

              {form.valueType ===
                "boolean" ? (
                <select
                  value={form.value}
                  onChange={(e) =>
                    updateField(
                      "value",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400"
                >
                  <option value="true">
                    true
                  </option>
                  <option value="false">
                    false
                  </option>
                </select>
              ) : form.valueType ===
                "null" ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  This setting will store
                  a null value.
                </div>
              ) : (
                <div className="relative">
                  {form.valueType ===
                    "json" ? (
                    <textarea
                      value={
                        form.value
                      }
                      onChange={(e) =>
                        updateField(
                          "value",
                          e.target.value
                        )
                      }
                      rows={7}
                      placeholder={`{
  "example": true
}`}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm outline-none focus:border-gray-400"
                    />
                  ) : (
                    <input
                      type={
                        form.valueType ===
                        "number"
                          ? "number"
                          : form.isSensitive &&
                            !showSensitive
                          ? "password"
                          : "text"
                      }
                      value={
                        form.value
                      }
                      onChange={(e) =>
                        updateField(
                          "value",
                          e.target.value
                        )
                      }
                      required={
                        form.valueType !==
                        "null"
                      }
                      placeholder={
                        form.valueType ===
                        "number"
                          ? "0"
                          : "Enter value"
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm outline-none focus:border-gray-400"
                    />
                  )}

                  {form.isSensitive &&
                    form.valueType !==
                      "json" && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSensitive(
                            (value) =>
                              !value
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 ui-btn-outline"
                      >
                        {showSensitive ? (
                          <EyeOff
                            size={17}
                          />
                        ) : (
                          <Eye
                            size={17}
                          />
                        )}
                      </button>
                    )}
                </div>
              )}

              {isEdit &&
                form.isSensitive && (
                  <p className="mt-2 text-xs text-orange-600">
                    The existing sensitive
                    value is never returned by
                    the API. Enter a new value
                    only if you want to replace
                    it.
                  </p>
                )}
            </div>

            {/* Sensitive */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={
                    form.isSensitive
                  }
                  onChange={(e) =>
                    updateField(
                      "isSensitive",
                      e.target.checked
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                />

                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Sensitive setting
                  </span>

                  <span className="mt-1 block text-xs text-gray-500">
                    The API will never return
                    the stored value when this
                    is enabled.
                  </span>
                </span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Description
              </label>

              <textarea
                value={
                  form.description
                }
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                maxLength={500}
                rows={4}
                placeholder="Describe what this setting controls..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/settings"
                )
              }
              className="rounded-xl border px-5 py-2.5 text-sm font-medium ui-btn-outline"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 ui-btn-primary"
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Setting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingForm;