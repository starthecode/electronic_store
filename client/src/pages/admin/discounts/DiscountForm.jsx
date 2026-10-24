import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  Percent,
  Save,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createDiscount,
  getDiscount,
  updateDiscount,
} from "../../../services/discount.service";

const INITIAL_FORM = {
  name: "",
  code: "",
  type: "PERCENTAGE",
  scope: "ORDER",
  status: "ACTIVE",
  value: "",
  minimumAmount: "",
  maximumDiscount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
};

const TYPE_OPTIONS = [
  {
    value: "PERCENTAGE",
    label: "Percentage",
    description:
      "Discount a percentage of the eligible amount.",
  },
  {
    value: "FIXED_AMOUNT",
    label: "Fixed Amount",
    description:
      "Discount a fixed monetary amount.",
  },
];

const SCOPE_OPTIONS = [
  {
    value: "ORDER",
    label: "Entire Order",
    description:
      "Apply the discount to the eligible order.",
  },
  {
    value: "PRODUCT",
    label: "Specific Products",
    description:
      "Apply the discount only to assigned products.",
  },
  {
    value: "CATEGORY",
    label: "Specific Categories",
    description:
      "Apply the discount only to assigned categories.",
  },
];

const STATUS_OPTIONS = [
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "EXPIRED",
    label: "Expired",
  },
];

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toISOStringOrNull(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeDiscount(discount) {
  return {
    name: discount?.name || "",
    code: discount?.code || "",
    type: discount?.type || "PERCENTAGE",
    scope: discount?.scope || "ORDER",
    status: discount?.status || "ACTIVE",
    value:
      discount?.value !== undefined &&
      discount?.value !== null
        ? String(discount.value)
        : "",
    minimumAmount:
      discount?.minimumAmount !== undefined &&
      discount?.minimumAmount !== null
        ? String(discount.minimumAmount)
        : "",
    maximumDiscount:
      discount?.maximumDiscount !== undefined &&
      discount?.maximumDiscount !== null
        ? String(discount.maximumDiscount)
        : "",
    usageLimit:
      discount?.usageLimit !== undefined &&
      discount?.usageLimit !== null
        ? String(discount.usageLimit)
        : "",
    startsAt: toDateTimeLocal(
      discount?.startsAt
    ),
    expiresAt: toDateTimeLocal(
      discount?.expiresAt
    ),
  };
}

export default function DiscountForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(isEditMode);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [loadedDiscount, setLoadedDiscount] =
    useState(null);

  useEffect(() => {
    if (!isEditMode) return;

    let mounted = true;

    const loadDiscount = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getDiscount(id);

        if (!response.success) {
          throw new Error(
            response.message ||
              "Failed to load discount"
          );
        }

        if (!mounted) return;

        const discount = response.data;

        setLoadedDiscount(discount);
        setForm(
          normalizeDiscount(discount)
        );
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load discount"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDiscount();

    return () => {
      mounted = false;
    };
  }, [id, isEditMode]);

  const selectedType = useMemo(
    () =>
      TYPE_OPTIONS.find(
        (option) =>
          option.value === form.type
      ),
    [form.type]
  );

  const selectedScope = useMemo(
    () =>
      SCOPE_OPTIONS.find(
        (option) =>
          option.value === form.scope
      ),
    [form.scope]
  );

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });

    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const errors = {};

    const name = form.name.trim();
    const code = form.code.trim();
    const value = Number(form.value);

    if (name.length < 2) {
      errors.name =
        "Name must be at least 2 characters.";
    }

    if (name.length > 200) {
      errors.name =
        "Name cannot exceed 200 characters.";
    }

    if (code.length < 2) {
      errors.code =
        "Discount code must be at least 2 characters.";
    }

    if (code.length > 50) {
      errors.code =
        "Discount code cannot exceed 50 characters.";
    }

    if (!form.value || Number.isNaN(value)) {
      errors.value =
        "Discount value is required.";
    } else if (value < 0) {
      errors.value =
        "Discount value cannot be negative.";
    } else if (
      form.type === "PERCENTAGE" &&
      (value <= 0 || value > 100)
    ) {
      errors.value =
        "Percentage must be greater than 0 and at most 100.";
    } else if (
      form.type === "FIXED_AMOUNT" &&
      value <= 0
    ) {
      errors.value =
        "Fixed discount amount must be greater than 0.";
    }

    if (
      form.minimumAmount !== "" &&
      (Number.isNaN(
        Number(form.minimumAmount)
      ) ||
        Number(form.minimumAmount) < 0)
    ) {
      errors.minimumAmount =
        "Minimum amount cannot be negative.";
    }

    if (
      form.maximumDiscount !== "" &&
      (Number.isNaN(
        Number(form.maximumDiscount)
      ) ||
        Number(form.maximumDiscount) <= 0)
    ) {
      errors.maximumDiscount =
        "Maximum discount must be greater than 0.";
    }

    if (
      form.usageLimit !== "" &&
      (!Number.isInteger(
        Number(form.usageLimit)
      ) ||
        Number(form.usageLimit) < 1)
    ) {
      errors.usageLimit =
        "Usage limit must be a whole number greater than 0.";
    }

    if (!form.startsAt) {
      errors.startsAt =
        "Start date is required.";
    }

    if (
      form.startsAt &&
      form.expiresAt
    ) {
      const starts = new Date(
        form.startsAt
      );
      const expires = new Date(
        form.expiresAt
      );

      if (expires <= starts) {
        errors.expiresAt =
          "Expiry date must be after the start date.";
      }
    }

    if (
      isEditMode &&
      loadedDiscount?.usageCount != null &&
      form.usageLimit !== ""
    ) {
      const usageLimit = Number(
        form.usageLimit
      );
      const usageCount = Number(
        loadedDiscount.usageCount
      );

      if (usageLimit < usageCount) {
        errors.usageLimit = `Usage limit cannot be lower than current usage count (${usageCount}).`;
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      scope: form.scope,
      status: form.status,
      value: Number(form.value),
      minimumAmount:
        form.minimumAmount === ""
          ? null
          : Number(form.minimumAmount),
      maximumDiscount:
        form.maximumDiscount === ""
          ? null
          : Number(form.maximumDiscount),
      usageLimit:
        form.usageLimit === ""
          ? null
          : Number(form.usageLimit),
      startsAt: toISOStringOrNull(
        form.startsAt
      ),
      expiresAt: toISOStringOrNull(
        form.expiresAt
      ),
    };

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      let response;

      if (isEditMode) {
        response = await updateDiscount(
          id,
          payload
        );
      } else {
        response = await createDiscount(
          payload
        );
      }

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to save discount"
        );
      }

      const savedDiscount =
        response.data;

      navigate(
        `/admin/discounts/${savedDiscount.id}`,
        {
          replace: true,
          state: {
            message: isEditMode
              ? "Discount updated successfully."
              : "Discount created successfully.",
          },
        }
      );
    } catch (err) {
      const responseData =
        err?.response?.data;

      const backendErrors =
        responseData?.errors;

      if (
        backendErrors &&
        typeof backendErrors === "object"
      ) {
        setFieldErrors(
          normalizeBackendErrors(
            backendErrors
          )
        );
      }

      setError(
        responseData?.message ||
          err?.message ||
          "Failed to save discount"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormLoading />;
  }

  if (
    isEditMode &&
    !loadedDiscount &&
    error
  ) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/discounts")
          }
          className="inline-flex items-center gap-2 text-sm font-medium ui-btn-outline"
        >
          <ArrowLeft size={17} />
          Back to Discounts
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-800">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/admin/discounts")
            }
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium transition ui-btn-outline"
          >
            <ArrowLeft size={16} />
            Back to Discounts
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Tag size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {isEditMode
                  ? "Edit Discount"
                  : "Create Discount"}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {isEditMode
                  ? "Update the discount promotion and its validity."
                  : "Create a promotional discount code for your store."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic information */}
        <Section
          title="Basic Information"
          description="Set the name and customer-facing discount code."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Discount Name"
              required
              error={fieldErrors.name}
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setField(
                    "name",
                    e.target.value
                  )
                }
                placeholder="e.g. Festival Sale"
                maxLength={200}
                className={inputClass(
                  fieldErrors.name
                )}
              />
            </Field>

            <Field
              label="Discount Code"
              required
              error={fieldErrors.code}
              hint="Customers will enter this code at checkout."
            >
              <div className="relative">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setField(
                      "code",
                      e.target.value
                        .toUpperCase()
                    )
                  }
                  placeholder="e.g. FESTIVAL20"
                  maxLength={50}
                  className={`${inputClass(
                    fieldErrors.code
                  )} pr-12 font-mono uppercase`}
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                  CODE
                </span>
              </div>
            </Field>
          </div>
        </Section>

        {/* Discount configuration */}
        <Section
          title="Discount Configuration"
          description="Choose how much the customer receives and where the discount applies."
        >
          <div className="space-y-6">
            {/* Type */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-800">
                Discount Type
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                {TYPE_OPTIONS.map(
                  (option) => (
                    <OptionCard
                      key={option.value}
                      selected={
                        form.type ===
                        option.value
                      }
                      onClick={() =>
                        setField(
                          "type",
                          option.value
                        )
                      }
                      icon={
                        option.value ===
                        "PERCENTAGE" ? (
                          <Percent
                            size={18}
                          />
                        ) : (
                          <span className="text-lg font-semibold">
                            ₹
                          </span>
                        )
                      }
                      title={option.label}
                      description={
                        option.description
                      }
                    />
                  )
                )}
              </div>
            </div>

            {/* Value */}
            <div className="max-w-md">
              <Field
                label={
                  form.type ===
                  "PERCENTAGE"
                    ? "Discount Percentage"
                    : "Discount Amount"
                }
                required
                error={fieldErrors.value}
              >
                <div className="relative">
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setField(
                        "value",
                        e.target.value
                      )
                    }
                    min={
                      form.type ===
                      "PERCENTAGE"
                        ? "0.01"
                        : "0.01"
                    }
                    max={
                      form.type ===
                      "PERCENTAGE"
                        ? "100"
                        : undefined
                    }
                    step="0.01"
                    placeholder={
                      form.type ===
                      "PERCENTAGE"
                        ? "20"
                        : "500"
                    }
                    className={`${inputClass(
                      fieldErrors.value
                    )} ${
                      form.type ===
                      "PERCENTAGE"
                        ? "pr-10"
                        : "pl-9"
                    }`}
                  />

                  {form.type ===
                  "PERCENTAGE" ? (
                    <Percent
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  ) : (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      ₹
                    </span>
                  )}
                </div>

                {!fieldErrors.value && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    {selectedType?.description}
                  </p>
                )}
              </Field>
            </div>

            {/* Scope */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-800">
                Discount Scope
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="grid gap-3 md:grid-cols-3">
                {SCOPE_OPTIONS.map(
                  (option) => (
                    <OptionCard
                      key={option.value}
                      selected={
                        form.scope ===
                        option.value
                      }
                      onClick={() =>
                        setField(
                          "scope",
                          option.value
                        )
                      }
                      title={option.label}
                      description={
                        option.description
                      }
                    />
                  )
                )}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                {selectedScope?.description}
              </p>
            </div>
          </div>
        </Section>

        {/* Conditions */}
        <Section
          title="Discount Conditions"
          description="Control minimum order value, discount limits and total usage."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <Field
              label="Minimum Amount"
              error={
                fieldErrors.minimumAmount
              }
              hint="Optional"
            >
              <MoneyInput
                value={form.minimumAmount}
                onChange={(value) =>
                  setField(
                    "minimumAmount",
                    value
                  )
                }
                error={
                  fieldErrors.minimumAmount
                }
                placeholder="0.00"
              />
            </Field>

            <Field
              label="Maximum Discount"
              error={
                fieldErrors.maximumDiscount
              }
              hint={
                form.type ===
                "PERCENTAGE"
                  ? "Optional cap"
                  : "Optional"
              }
            >
              <MoneyInput
                value={form.maximumDiscount}
                onChange={(value) =>
                  setField(
                    "maximumDiscount",
                    value
                  )
                }
                error={
                  fieldErrors.maximumDiscount
                }
                placeholder="0.00"
              />
            </Field>

            <Field
              label="Usage Limit"
              error={
                fieldErrors.usageLimit
              }
              hint={
                loadedDiscount?.usageCount !=
                null
                  ? `${Number(
                      loadedDiscount.usageCount
                    )} used`
                  : "Optional · unlimited if empty"
              }
            >
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) =>
                  setField(
                    "usageLimit",
                    e.target.value
                  )
                }
                min="1"
                step="1"
                placeholder="Unlimited"
                className={inputClass(
                  fieldErrors.usageLimit
                )}
              />
            </Field>
          </div>
        </Section>

        {/* Validity */}
        <Section
          title="Validity"
          description="Define when this discount becomes available and when it expires."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Start Date & Time"
              required
              error={
                fieldErrors.startsAt
              }
            >
              <DateTimeInput
                value={form.startsAt}
                onChange={(value) =>
                  setField(
                    "startsAt",
                    value
                  )
                }
                error={
                  fieldErrors.startsAt
                }
              />
            </Field>

            <Field
              label="Expiry Date & Time"
              error={
                fieldErrors.expiresAt
              }
              hint="Optional · leave empty for no expiry"
            >
              <DateTimeInput
                value={form.expiresAt}
                onChange={(value) =>
                  setField(
                    "expiresAt",
                    value
                  )
                }
                error={
                  fieldErrors.expiresAt
                }
              />
            </Field>
          </div>
        </Section>

        {/* Status */}
        <Section
          title="Status"
          description="Control whether the discount is currently available."
        >
          <div className="max-w-md">
            <label className="mb-3 block text-sm font-medium text-gray-800">
              Discount Status
            </label>

            <div className="relative">
              <select
                value={form.status}
                onChange={(e) =>
                  setField(
                    "status",
                    e.target.value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5"
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-gray-50/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/discounts")
              }
              disabled={saving}
              className="h-11 rounded-xl border px-5 text-sm font-medium transition disabled:opacity-50 ui-btn-outline"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ui-btn-primary"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Discount"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* --------------------------------------------------
   Reusable components
-------------------------------------------------- */

function Section({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  required = false,
  error,
  hint,
  children,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-800">
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>

        {hint && !error && (
          <span className="text-xs text-gray-400">
            {hint}
          </span>
        )}
      </div>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={(`relative flex min-h-[86px] items-start gap-3 rounded-xl border p-4 text-left transition${
        selected
          ? "ring-1"
          : ""
      }`) + "ui-btn-outline"}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          selected
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon || <Tag size={17} />}
      </div>

      <div className="min-w-0 pr-5">
        <div className="text-sm font-semibold text-gray-900">
          {title}
        </div>

        <div className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </div>
      </div>

      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white">
          <Check size={12} />
        </div>
      )}
    </button>
  );
}

function MoneyInput({
  value,
  onChange,
  error,
  placeholder,
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
        ₹
      </span>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        min="0"
        step="0.01"
        placeholder={placeholder}
        className={`${inputClass(
          error
        )} pl-9`}
      />
    </div>
  );
}

function DateTimeInput({
  value,
  onChange,
  error,
}) {
  return (
    <div className="relative">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`${inputClass(
          error
        )} pr-10`}
      />

      <CalendarDays
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

function inputClass(error) {
  return `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
      : "border-gray-200 focus:border-gray-900 focus:ring-gray-900/5"
  }`;
}

function FormLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-gray-100" />

      {[
        "basic",
        "config",
        "conditions",
        "validity",
        "status",
      ].map((section) => (
        <div
          key={section}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <div className="mb-6 h-5 w-40 rounded bg-gray-100" />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-11 rounded-xl bg-gray-100" />
            <div className="h-11 rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function normalizeBackendErrors(errors) {
  const normalized = {};

  if (Array.isArray(errors)) {
    errors.forEach((item) => {
      if (
        item?.path &&
        typeof item.path === "string"
      ) {
        normalized[item.path] =
          item.message;
      }
    });

    return normalized;
  }

  Object.entries(errors).forEach(
    ([key, value]) => {
      normalized[key] = Array.isArray(value)
        ? value[0]
        : String(value);
    }
  );

  return normalized;
}