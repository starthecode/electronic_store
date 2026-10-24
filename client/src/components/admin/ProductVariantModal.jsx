import { useEffect, useState } from "react";
import {
  LoaderCircle,
  Save,
  X,
} from "lucide-react";

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  status: "ACTIVE",
};

const ProductVariantModal = ({
  open,
  variant,
  saving,
  error,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] =
    useState(emptyForm);

  const [fieldErrors, setFieldErrors] =
    useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (variant) {
      setForm({
        name: variant.name ?? "",
        sku: variant.sku ?? "",
        price:
          variant.price != null
            ? String(variant.price)
            : "",
        compareAtPrice:
          variant.compareAtPrice != null
            ? String(variant.compareAtPrice)
            : "",
        costPrice:
          variant.costPrice != null
            ? String(variant.costPrice)
            : "",
        status:
          variant.status ?? "ACTIVE",
      });
    } else {
      setForm(emptyForm);
    }

    setFieldErrors({});
  }, [open, variant]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const errors = {};

    if (!form.sku.trim()) {
      errors.sku = "SKU is required.";
    }

    if (!form.price) {
      errors.price = "Price is required.";
    } else if (
      Number.isNaN(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      errors.price =
        "Price must be greater than 0.";
    }

    if (
      form.compareAtPrice &&
      Number(form.compareAtPrice) <= 0
    ) {
      errors.compareAtPrice =
        "Compare price must be greater than 0.";
    }

    if (
      form.costPrice &&
      Number(form.costPrice) < 0
    ) {
      errors.costPrice =
        "Cost price cannot be negative.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSubmit({
      name: form.name.trim() || undefined,
      sku: form.sku.trim(),
      price: Number(form.price),
      compareAtPrice:
        form.compareAtPrice
          ? Number(form.compareAtPrice)
          : undefined,
      costPrice:
        form.costPrice
          ? Number(form.costPrice)
          : undefined,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {variant
                ? "Edit Variant"
                : "Add Variant"}
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              {variant
                ? "Update variant information."
                : "Create a new product variant."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 transition ui-btn-outline"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            {error && (
              <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="variant-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Variant Name
              </label>

              <input
                id="variant-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. 55 Inch Black"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* SKU */}
            <div>
              <label
                htmlFor="variant-sku"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                SKU
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="variant-sku"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="SONY-TV-55-BLK"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${
                  fieldErrors.sku
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />

              {fieldErrors.sku && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.sku}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="variant-status"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="variant-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="variant-price"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Price
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="variant-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="49999"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${
                  fieldErrors.price
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />

              {fieldErrors.price && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.price}
                </p>
              )}
            </div>

            {/* Compare Price */}
            <div>
              <label
                htmlFor="variant-compare-price"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Compare At Price
              </label>

              <input
                id="variant-compare-price"
                name="compareAtPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.compareAtPrice}
                onChange={handleChange}
                placeholder="54999"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${
                  fieldErrors.compareAtPrice
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />

              {fieldErrors.compareAtPrice && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.compareAtPrice}
                </p>
              )}
            </div>

            {/* Cost Price */}
            <div>
              <label
                htmlFor="variant-cost-price"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Cost Price
              </label>

              <input
                id="variant-cost-price"
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={handleChange}
                placeholder="40000"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${
                  fieldErrors.costPrice
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />

              {fieldErrors.costPrice && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.costPrice}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium transition disabled:opacity-50 ui-btn-outline"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ui-btn-primary"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {variant
                    ? "Save Changes"
                    : "Create Variant"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductVariantModal;