import {
  Package,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  addDiscountProduct,
  getDiscountProducts,
  removeDiscountProduct,
} from "../../services/discount.service";

import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export default function DiscountProducts({
  discount,
  onChanged,
}) {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showAdd, setShowAdd] =
    useState(false);

  const [availableProducts, setAvailableProducts] =
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

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDiscountProducts(
          discount.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load products"
        );
      }

      setProducts(
        response.data || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [discount.id]);

  const openAddModal = async () => {
    setShowAdd(true);
    setSearch("");

    try {
      setLoadingAvailable(true);

      const response = await api.get(
        "/products",
        {
          params: {
            page: 1,
            limit: 50,
            search: "",
            status: "ACTIVE",
          },
        }
      );

      setAvailableProducts(
        extractList(response.data)
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load products"
      );
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAdd = async (product) => {
    try {
      setSavingId(product.id);

      const response =
        await addDiscountProduct(
          discount.id,
          product.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to assign product"
        );
      }

      await loadProducts();

      setShowAdd(false);

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign product"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (product) => {
    const confirmed =
      window.confirm(
        `Remove "${product.name}" from this discount?`
      );

    if (!confirmed) return;

    try {
      setRemovingId(product.id);

      const response =
        await removeDiscountProduct(
          discount.id,
          product.id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to remove product"
        );
      }

      await loadProducts();

      if (onChanged) {
        await onChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove product"
      );
    } finally {
      setRemovingId(null);
    }
  };

  const assignedIds = new Set(
    products.map((item) =>
      item.product?.id || item.id
    )
  );

  const filteredProducts =
    availableProducts.filter(
      (product) => {
        if (assignedIds.has(product.id)) {
          return false;
        }

        if (!search.trim()) {
          return true;
        }

        const term =
          search.toLowerCase();

        return (
          product.name
            ?.toLowerCase()
            .includes(term) ||
          product.slug
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
            Assigned Products
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Products eligible for this discount.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : products.length === 0 ? (
        <EmptyAssignment
          icon={<Package size={22} />}
          title="No products assigned"
          description="Add products that should be eligible for this discount."
          onAdd={openAddModal}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-100">
            {products.map((item) => {
              const product =
                item.product || item;

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {product.name}
                    </p>

                    {product.slug && (
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {product.slug}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      removingId ===
                      product.id
                    }
                    onClick={() =>
                      handleRemove(product)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title="Remove product"
                  >
                    {removingId ===
                    product.id ? (
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
          title="Add Product"
          search={search}
          setSearch={setSearch}
          loading={loadingAvailable}
          items={filteredProducts}
          onClose={() =>
            setShowAdd(false)
          }
          onSelect={handleAdd}
          savingId={savingId}
          emptyMessage={
            search
              ? "No matching products found."
              : "No active products available."
          }
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

  if (Array.isArray(data?.products)) {
    return data.products;
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
  emptyMessage,
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
              Select an item to assign.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900"
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
              placeholder="Search..."
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
              {emptyMessage}
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
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.name}
                    </p>

                    {item.slug && (
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {item.slug}
                      </p>
                    )}
                  </div>

                  {savingId ===
                  item.id ? (
                    <Loader2
                      size={17}
                      className="shrink-0 animate-spin text-gray-400"
                    />
                  ) : (
                    <Plus
                      size={17}
                      className="shrink-0 text-gray-400"
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

function EmptyAssignment({
  icon,
  title,
  description,
  onAdd,
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        {icon}
      </div>

      <h4 className="mt-3 text-sm font-semibold text-gray-900">
        {title}
      </h4>

      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Plus size={15} />
        Add Product
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
            <div className="space-y-2">
              <div className="h-3 w-48 rounded bg-gray-100" />
              <div className="h-2.5 w-32 rounded bg-gray-100" />
            </div>

            <div className="h-9 w-9 rounded-lg bg-gray-100" />
          </div>
        )
      )}
    </div>
  );
}