import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  Package,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createProduct } from "../../services/product.service";
import { getCategories } from "../../services/category.service";
import { getBrands } from "../../services/brand.service";

const ProductForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    brandId: "",
    status: "ACTIVE",
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const [
          categoriesResponse,
          brandsResponse,
        ] = await Promise.all([
          getCategories({
            page: 1,
            limit: 100,
          }),
          getBrands({
            page: 1,
            limit: 100,
          }),
        ]);

        const categoriesData =
          categoriesResponse.data;

        const brandsData = brandsResponse.data;

        setCategories(
          Array.isArray(
            categoriesData?.categories
          )
            ? categoriesData.categories
            : Array.isArray(categoriesData)
              ? categoriesData
              : []
        );

        setBrands(
          Array.isArray(brandsData?.brands)
            ? brandsData.brands
            : Array.isArray(brandsData)
              ? brandsData
              : []
        );
      } catch (err) {
        console.error(
          "Product form options error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load categories and brands."
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

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

    if (error) {
      setError("");
    }
  };

  const generateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setForm((previous) => ({
      ...previous,
      slug,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      slug: undefined,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        shortDescription:
          form.shortDescription.trim() || undefined,
        description:
          form.description.trim() || undefined,
        categoryId:
          form.categoryId || undefined,
        brandId:
          form.brandId || undefined,
        status: form.status,
      };

      await createProduct(payload);

      navigate("/admin/products", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Product create error:",
        err
      );

      const responseErrors =
        err.response?.data?.errors;

      if (Array.isArray(responseErrors)) {
        const mappedErrors = {};

        responseErrors.forEach((item) => {
          const field =
            item.path?.[1] ||
            item.path?.[0];

          if (field) {
            mappedErrors[field] =
              item.message;
          }
        });

        setFieldErrors(mappedErrors);
      }

      setError(
        err.response?.data?.message ||
          "Unable to create product."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/products")
          }
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Add Product
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create a new product for your store.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Information */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2 text-orange-500">
                <Package size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  Basic Information
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Basic information about the product.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            {/* Name */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Product Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Samsung 55 Inch 4K Smart TV"
                required
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${
                  fieldErrors.name
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />

              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700"
                >
                  Slug
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <button
                  type="button"
                  onClick={generateSlug}
                  disabled={!form.name.trim()}
                  className="text-xs font-medium text-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Generate
                </button>
              </div>

              <input
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="samsung-55-inch-4k-smart-tv"
                required
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${
                  fieldErrors.slug
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />

              {fieldErrors.slug && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.slug}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="status"
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

            {/* Category */}
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Category
              </label>

              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                disabled={loadingOptions}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label
                htmlFor="brandId"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Brand
              </label>

              <select
                id="brandId"
                name="brandId"
                value={form.brandId}
                onChange={handleChange}
                disabled={loadingOptions}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
              >
                <option value="">
                  Select brand
                </option>

                {brands.map((brand) => (
                  <option
                    key={brand.id}
                    value={brand.id}
                  >
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="shortDescription"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Short Description
              </label>

              <textarea
                id="shortDescription"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary of the product..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={7}
                placeholder="Detailed product description..."
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/products")
            }
            disabled={saving}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || loadingOptions}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Creating...
              </>
            ) : (
              <>
                <Save size={18} />
                Create Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;