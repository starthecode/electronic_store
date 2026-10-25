import { useEffect, useState } from "react";
import { Loader2, PackagePlus, X } from "lucide-react";
import { getProducts } from "../../services/product.service";
import { getVariants } from "../../services/variant.service";
import { createInventory } from "../../services/inventory.service";

const unwrap = (response) => response?.data?.data ?? response?.data;

const getErrorMessage = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Unable to create inventory.";
  const details = error?.response?.data?.errors;

  if (!Array.isArray(details) || details.length === 0) {
    return message;
  }

  const issues = details
    .map((issue) => issue.message)
    .filter(Boolean);

  return issues.length > 0 ? `${message}: ${issues.join(", ")}` : message;
};

const AddInventoryModal = ({ onClose, onCreated, onOpenExistingInventory }) => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("0");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const allProducts = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = unwrap(
            await getProducts({ page, limit: 100, sortBy: "name", sortOrder: "asc" })
          );
          const pageProducts = Array.isArray(response?.products)
            ? response.products
            : Array.isArray(response)
              ? response
              : [];

          allProducts.push(...pageProducts);
          totalPages = response?.pagination?.totalPages ?? 1;
          page += 1;
        }

        if (!cancelled) setProducts(allProducts);
      } catch (loadError) {
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVariants = async () => {
      if (!productId) {
        setVariants([]);
        setVariantId("");
        setLoadingVariants(false);
        return;
      }

      try {
        setLoadingVariants(true);
        setError("");
        const allVariants = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = unwrap(
            await getVariants(productId, { page, limit: 100 })
          );
          const pageVariants = Array.isArray(response?.variants)
            ? response.variants
            : Array.isArray(response)
              ? response
              : [];

          allVariants.push(...pageVariants);
          totalPages = response?.pagination?.totalPages ?? 1;
          page += 1;
        }

        if (!cancelled) {
          setVariants(allVariants);
          setVariantId("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setVariants([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) setLoadingVariants(false);
      }
    };

    loadVariants();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedProduct = products.find((product) => product.id === productId);
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const existingInventory = selectedVariant?.inventory;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const parsedQuantity = Number(quantity);
    const parsedReorderLevel = Number(reorderLevel);
    const maxInteger = 2147483647;

    if (
      !Number.isSafeInteger(parsedQuantity) ||
      parsedQuantity < 0 ||
      parsedQuantity > maxInteger
    ) {
      setError("Enter an initial stock quantity between 0 and 2,147,483,647.");
      return;
    }

    if (
      !Number.isSafeInteger(parsedReorderLevel) ||
      parsedReorderLevel < 0 ||
      parsedReorderLevel > maxInteger
    ) {
      setError("Enter a reorder level between 0 and 2,147,483,647.");
      return;
    }

    if (!productId || !variantId || existingInventory) return;

    try {
      setSubmitting(true);
      await createInventory(productId, variantId, {
        quantity: parsedQuantity,
        reorderLevel: parsedReorderLevel,
      });
      await onCreated();
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustExisting = () => {
    if (!selectedVariant || !existingInventory || !selectedProduct) return;

    onOpenExistingInventory({
      ...existingInventory,
      availableQuantity:
        existingInventory.quantity - existingInventory.reservedQuantity,
      isLowStock:
        existingInventory.quantity - existingInventory.reservedQuantity <=
        existingInventory.reorderLevel,
      variant: {
        ...selectedVariant,
        product: selectedProduct,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Inventory</h2>
            <p className="mt-1 text-sm text-gray-500">
              Initialize stock for an existing product variant.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-lg p-2 ui-btn-outline"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="inventory-product" className="mb-1 block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              id="inventory-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              disabled={loadingProducts || submitting}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="">
                {loadingProducts ? "Loading products..." : "Select a product"}
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inventory-variant" className="mb-1 block text-sm font-medium text-gray-700">
              Variant
            </label>
            <select
              id="inventory-variant"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              disabled={!productId || loadingVariants || submitting}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="">
                {loadingVariants
                  ? "Loading variants..."
                  : productId
                    ? "Select a variant"
                    : "Select a product first"}
              </option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name || "Default variant"} · {variant.sku}
                  {variant.inventory ? " · Inventory exists" : ""}
                </option>
              ))}
            </select>
          </div>

          {existingInventory ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-900">
                Inventory already exists for this variant. Use stock adjustment
                instead of creating a duplicate.
              </p>
              <button
                type="button"
                onClick={handleAdjustExisting}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-medium ui-btn-outline"
              >
                Adjust existing stock
              </button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="initial-stock" className="mb-1 block text-sm font-medium text-gray-700">
                  Actual initial stock quantity
                </label>
                <input
                  id="initial-stock"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                  disabled={submitting}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor="inventory-reorder-level" className="mb-1 block text-sm font-medium text-gray-700">
                  Reorder level
                </label>
                <input
                  id="inventory-reorder-level"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  value={reorderLevel}
                  onChange={(event) => setReorderLevel(event.target.value)}
                  disabled={submitting}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium ui-btn-outline"
            >
              Cancel
            </button>
            {!existingInventory && (
              <button
                type="submit"
                disabled={submitting || loadingProducts || loadingVariants}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ui-btn-primary"
              >
                {submitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <PackagePlus size={17} />
                )}
                {submitting ? "Creating..." : "Create Inventory"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryModal;
