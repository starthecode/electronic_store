import {
  FolderTree,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  addDiscountCategory,
  getDiscountCategories,
  removeDiscountCategory,
} from "../../services/discount.service";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export default function DiscountCategories({
  discount,
  onChanged,
}) {
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showAdd, setShowAdd] =
    useState(false);

  const [availableCategories, setAvailableCategories] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loadingAvailable, setLoadingAvailable] =
    useState(false);

  const [savingId, setSavingId] =
    useState(null);

  const [removingId, setRemovingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDiscountCategories(
          discount.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load categories"
        );
      }

      setCategories(
        response.data || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [discount.id]);

  const openAddModal = async () => {
    setShowAdd(true);
    setSearch("");

    try {
      setLoadingAvailable(true);

      const response = await api.get(
        "/categories",
        {
          params: {
            page: 1,
            limit: 100,
            status: "ACTIVE",
          },
        }
      );

      setAvailableCategories(
        extractList(response.data)
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAdd = async (category) => {
    try {
      setSavingId(category.id);

      const response =
        await addDiscountCategory(
          discount.id,
          category.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to assign category"
        );
      }

      await loadCategories();

      setShowAdd(false);

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign category"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (category) => {
    const confirmed =
      window.confirm(
        `Remove "${category.name}" from this discount?`
      );

    if (!confirmed) return;

    try {
      setRemovingId(category.id);

      const response =
        await removeDiscountCategory(
          discount.id,
          category.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to remove category"
        );
      }

      await loadCategories();

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove category"
      );
    } finally {
      setRemovingId(null);
    }
  };

  const assignedIds = new Set(
    categories.map((item) =>
      item.category?.id || item.id
    )
  );

  const filteredCategories =
    availableCategories.filter(
      (category) => {
        if (assignedIds.has(category.id)) {
          return false;
        }

        if (!search.trim()) {
          return true;
        }

        const term =
          search.toLowerCase();

        return (
          category.name
            ?.toLowerCase()
            .includes(term) ||
          category.slug
            ?.toLowerCase()
            .includes(term)
        );
      }
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Assigned Categories
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Categories eligible for this discount.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium ui-btn-primary"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : categories.length === 0 ? (
        <EmptyState
          onAdd={openAddModal}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-100">
            {categories.map((item) => {
              const category =
                item.category || item;

              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4 px-4 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <FolderTree
                        size={17}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {category.name}
                      </p>

                      {category.slug && (
                        <p className="mt-1 truncate text-xs text-gray-400">
                          {category.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      removingId ===
                      category.id
                    }
                    onClick={() =>
                      handleRemove(category)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 ui-btn-danger"
                    title="Remove category"
                  >
                    {removingId ===
                    category.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <SelectionModal
          title="Add Category"
          search={search}
          setSearch={setSearch}
          loading={loadingAvailable}
          items={filteredCategories}
          onClose={() =>
            setShowAdd(false)
          }
          onSelect={handleAdd}
          savingId={savingId}
        />
      )}
    </div>
  );
}

function extractList(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.categories)) {
    return data.categories;
  }

  return [];
}

function SelectionModal({
  title,
  search,
  setSearch,
  loading,
  items,
  onClose,
  onSelect,
  savingId,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {title}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Select a category to assign.
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

        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              autoFocus
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search categories..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-gray-900"
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2
                size={22}
                className="animate-spin text-gray-400"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No matching categories found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  disabled={
                    savingId === item.id
                  }
                  onClick={() =>
                    onSelect(item)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left disabled:opacity-50 ui-btn-outline"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FolderTree
                      size={17}
                      className="shrink-0 text-gray-400"
                    />

                    <span className="truncate text-sm font-medium text-gray-900">
                      {item.name}
                    </span>
                  </div>

                  {savingId ===
                  item.id ? (
                    <Loader2
                      size={17}
                      className="animate-spin text-gray-400"
                    />
                  ) : (
                    <Plus
                      size={17}
                      className="text-gray-400"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <FolderTree size={22} />
      </div>

      <h4 className="mt-3 text-sm font-semibold text-gray-900">
        No categories assigned
      </h4>

      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        Add categories that should be eligible for this discount.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ui-btn-outline"
      >
        <Plus size={15} />
        Add Category
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200">
      {Array.from({ length: 3 }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-gray-100 px-4 py-4 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-100" />

              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-gray-100" />
                <div className="h-2.5 w-24 rounded bg-gray-100" />
              </div>
            </div>

            <div className="h-9 w-9 rounded-lg bg-gray-100" />
          </div>
        )
      )}
    </div>
  );
}