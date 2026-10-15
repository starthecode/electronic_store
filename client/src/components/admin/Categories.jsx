import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../services/category.service";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  status: "ACTIVE",
  parentId: "",
};

const Categories = () => {
  const [categories, setCategories] = useState([]);

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
  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] = useState(emptyForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCategories({
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
      });

      const data = response.data;

      setCategories(
        Array.isArray(data?.categories)
          ? data.categories
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
        "Categories fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, status]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (page !== 1) {
      setPage(1);
      return;
    }

    fetchCategories();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      status: category.status || "ACTIVE",
      parentId: category.parentId || "",
    });

    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
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
        imageUrl:
          form.imageUrl.trim() || null,
        status: form.status,
        parentId: form.parentId || null,
      };

      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          payload
        );
      } else {
        await createCategory(payload);
      }

      handleCloseModal();

      if (!editingCategory && page !== 1) {
        setPage(1);
      } else {
        await fetchCategories();
      }
    } catch (err) {
      console.error(
        "Category save error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(category.id);
      setError("");

      await deleteCategory(category.id);

      await fetchCategories();
    } catch (err) {
      console.error(
        "Category delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete category."
      );
    } finally {
      setDeleting(null);
    }
  };

  /*
   * Parent categories need to be available while
   * creating/editing. We intentionally fetch all
   * categories here because the normal list is paginated.
   */
  const [parentCategories, setParentCategories] =
    useState([]);

  const fetchParentCategories = async () => {
    try {
      const response = await getCategories({
        page: 1,
        limit: 100,
      });

      const data = response.data;

      setParentCategories(
        Array.isArray(data?.categories)
          ? data.categories
          : []
      );
    } catch (err) {
      console.error(
        "Parent categories fetch error:",
        err
      );
    }
  };

  useEffect(() => {
    fetchParentCategories();
  }, []);

  const availableParents = useMemo(() => {
    return parentCategories.filter(
      (category) =>
        category.id !== editingCategory?.id
    );
  }, [
    parentCategories,
    editingCategory,
  ]);

  const getStatusClass = (categoryStatus) => {
    return categoryStatus === "ACTIVE"
      ? "bg-green-50 text-green-600"
      : "bg-gray-100 text-gray-500";
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product categories and category hierarchy.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <Plus size={17} />
          Add Category
        </button>
      </div>

      {/* Error */}
      {error && !showModal && (
        <div className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
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
              placeholder="Search categories..."
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
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
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
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <FolderTree
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-sm font-medium text-gray-600">
              No categories found
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Create your first product category.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Category
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Slug
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Parent
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Products
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Children
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
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <FolderTree
                                size={17}
                              />
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {category.name}
                            </p>

                            {category.description && (
                              <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">
                          {category.slug}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-600">
                          {category.parent?.name ||
                            "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {category._count
                            ?.products ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {category._count
                            ?.children ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                            category.status
                          )}`}
                        >
                          {category.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(
                                category
                              )
                            }
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                category
                              )
                            }
                            disabled={
                              deleting ===
                              category.id
                            }
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting ===
                            category.id ? (
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
                {categories.length === 0
                  ? 0
                  : (page - 1) * limit + 1}{" "}
                to{" "}
                {(page - 1) * limit +
                  categories.length}{" "}
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
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Configure category information and hierarchy.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
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
                    Category Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Televisions"
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
                    placeholder="televisions"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                  <p className="mt-1 text-[11px] text-gray-400">
                    Leave empty to generate automatically from the name.
                  </p>
                </div>

                {/* Parent */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Parent Category
                  </label>

                  <select
                    name="parentId"
                    value={form.parentId}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">
                      No parent category
                    </option>

                    {availableParents.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
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

                {/* Image URL */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Image URL
                  </label>

                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/category.jpg"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Image Preview */}
                {form.imageUrl && (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={form.imageUrl}
                      alt="Category preview"
                      className="h-32 w-full object-contain"
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
                    placeholder="Category description..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !form.name.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;