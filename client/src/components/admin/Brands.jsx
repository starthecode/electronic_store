import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../../services/brand.service";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  logoUrl: "",
  status: "ACTIVE",
};

const Brands = () => {
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] =
    useState(null);

  const [form, setForm] = useState(emptyForm);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBrands({
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
      });

      const data = response.data;

      setBrands(
        Array.isArray(data?.brands)
          ? data.brands
          : []
      );

      setPagination(
        data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(
        "Brands fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load brands."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page, status]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (page !== 1) {
      setPage(1);
      return;
    }

    fetchBrands();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (brand) => {
    setEditingBrand(brand);

    setForm({
      name: brand.name || "",
      slug: brand.slug || "",
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
      status: brand.status || "ACTIVE",
    });

    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingBrand(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Brand name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description:
          form.description.trim() || null,
        logoUrl:
          form.logoUrl.trim() || null,
        status: form.status,
      };

      if (editingBrand) {
        await updateBrand(
          editingBrand.id,
          payload
        );
      } else {
        await createBrand(payload);
      }

      handleCloseModal();

      if (!editingBrand && page !== 1) {
        setPage(1);
      } else {
        await fetchBrands();
      }
    } catch (err) {
      console.error(
        "Brand save error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save brand."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Delete brand "${brand.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(brand.id);
      setError("");

      await deleteBrand(brand.id);

      await fetchBrands();
    } catch (err) {
      console.error(
        "Brand delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete brand."
      );
    } finally {
      setDeleting(null);
    }
  };

  const getStatusClass = (brandStatus) => {
    return brandStatus === "ACTIVE"
      ? "bg-green-50 text-green-600"
      : "bg-gray-100 text-gray-500";
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Brands
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product brands and brand information.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ui-btn-primary"
        >
          <Plus size={17} />
          Add Brand
        </button>
      </div>

      {/* Error */}
      {error && !showModal && (
        <div className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
           className="ui-btn-outline">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1"
          >
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search brands..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          <button
            type="button"
            onClick={fetchBrands}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ui-btn-outline"
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
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            <LoaderCircle
              size={19}
              className="mr-2 animate-spin"
            />
            Loading brands...
          </div>
        ) : brands.length === 0 ? (
          <div className="py-16 text-center">
            <Tag
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-sm font-medium text-gray-600">
              No brands found
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Create your first product brand.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Brand
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Slug
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Products
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {brands.map((brand) => (
                    <tr
                      key={brand.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="h-10 w-10 rounded-lg border border-gray-200 object-contain bg-white"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <Tag size={17} />
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {brand.name}
                            </p>

                            {brand.description && (
                              <p className="mt-0.5 max-w-sm truncate text-xs text-gray-400">
                                {brand.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">
                          {brand.slug}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {brand._count
                            ?.products ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                            brand.status
                          )}`}
                        >
                          {brand.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(
                                brand
                              )
                            }
                            className="rounded-lg p-2 transition ui-btn-outline"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(brand)
                            }
                            disabled={
                              deleting ===
                              brand.id
                            }
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ui-btn-danger"
                            title="Delete"
                          >
                            {deleting ===
                            brand.id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={15}
                              />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                Showing{" "}
                {brands.length === 0
                  ? 0
                  : (page - 1) * limit + 1}{" "}
                to{" "}
                {(page - 1) * limit +
                  brands.length}{" "}
                of {pagination.total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (current) =>
                        current - 1
                    )
                  }
                  className="rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="text-xs font-medium text-gray-600">
                  Page {page} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                  className="rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-40 ui-btn-outline"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {editingBrand
                    ? "Edit Brand"
                    : "Add Brand"}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Configure brand information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-lg p-1.5 disabled:opacity-50 ui-btn-outline"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5"
            >
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Brand Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Sony"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Slug
                  </label>

                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    maxLength={120}
                    placeholder="sony"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                  <p className="mt-1 text-[11px] text-gray-400">
                    Leave empty to generate automatically.
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

                {/* Logo */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Logo URL
                  </label>

                  <input
                    type="url"
                    name="logoUrl"
                    value={form.logoUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/sony-logo.png"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Logo preview */}
                {form.logoUrl && (
                  <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={1000}
                    placeholder="Brand description..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ui-btn-outline"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !form.name.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ui-btn-primary"
                >
                  {saving && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingBrand
                    ? "Update Brand"
                    : "Create Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;