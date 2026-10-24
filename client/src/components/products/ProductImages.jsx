import { useEffect, useState } from "react";
import {
  ImagePlus,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  createProductImage,
  deleteProductImage,
  getProductImages,
  setPrimaryProductImage,
  updateProductImage,
} from "../../services/productImage.service";

const ProductImages = ({ productId }) => {
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [primaryId, setPrimaryId] = useState(null);

  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingImage, setEditingImage] = useState(null);

  const [form, setForm] = useState({
    url: "",
    altText: "",
    sortOrder: 0,
    isPrimary: false,
  });

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProductImages(productId);
      const data = response.data;

      const imageList = Array.isArray(data?.images)
        ? data.images
        : Array.isArray(data)
          ? data
          : [];

      setImages(imageList);

      const primary = imageList.find(
        (image) => image.isPrimary
      );

      setPrimaryId(primary?.id || null);
    } catch (err) {
      console.error("Product images fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load product images."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) {
      return;
    }

    fetchImages();
  }, [productId]);

  const resetForm = () => {
    setForm({
      url: "",
      altText: "",
      sortOrder: images.length,
      isPrimary: images.length === 0,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingImage(null);
    setShowAdd(true);
    setError("");
  };

  const handleOpenEdit = (image) => {
    setEditingImage(image);

    setForm({
      url: image.url || "",
      altText: image.altText || "",
      sortOrder: image.sortOrder ?? 0,
      isPrimary: image.isPrimary || false,
    });

    setShowAdd(false);
    setError("");
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditingImage(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.url.trim()) {
      setError("Image URL is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        url: form.url.trim(),
        altText: form.altText.trim() || undefined,
        sortOrder: Number(form.sortOrder),
        isPrimary: form.isPrimary,
      };

      if (editingImage) {
        await updateProductImage(
          productId,
          editingImage.id,
          payload
        );
      } else {
        await createProductImage(
          productId,
          payload
        );
      }

      handleCloseModal();
      await fetchImages();
    } catch (err) {
      console.error("Product image save error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save product image."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (image) => {
    if (image.isPrimary) {
      return;
    }

    try {
      setPrimaryId(image.id);
      setError("");

      await setPrimaryProductImage(
        productId,
        image.id
      );

      await fetchImages();
    } catch (err) {
      console.error(
        "Set primary image error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to set primary image."
      );

      await fetchImages();
    } finally {
      setPrimaryId(null);
    }
  };

  const handleDelete = async (image) => {
    const confirmed = window.confirm(
      "Delete this product image?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(image.id);
      setError("");

      await deleteProductImage(
        productId,
        image.id
      );

      await fetchImages();
    } catch (err) {
      console.error(
        "Product image delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete product image."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-50 p-2 text-orange-500">
            <ImagePlus size={17} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Product Images
            </h3>

            <p className="text-xs text-gray-500">
              Manage product images and primary image.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchImages}
            disabled={loading}
            className="rounded-lg p-2 transition disabled:opacity-50 ui-btn-outline"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={
                loading ? "animate-spin" : ""
              }
            />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ui-btn-primary"
          >
            <ImagePlus size={15} />
            Add Image
          </button>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-3 text-red-400 hover:text-red-600 ui-btn-danger"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-xs text-gray-400">
            <LoaderCircle
              size={17}
              className="mr-2 animate-spin"
            />
            Loading product images...
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
            <ImagePlus
              size={28}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-sm font-medium text-gray-600">
              No product images
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Add an image URL to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={
                      image.altText ||
                      "Product image"
                    }
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                  {image.isPrimary && (
                    <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-[10px] font-semibold text-white">
                      <Star
                        size={10}
                        fill="currentColor"
                      />
                      Primary
                    </div>
                  )}

                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSetPrimary(image)
                      }
                      disabled={
                        primaryId === image.id
                      }
                      className="absolute right-2 top-2 rounded-lg p-1.5 opacity-0 shadow-sm transition group-hover:opacity-100 disabled:opacity-50 ui-btn-outline"
                      title="Set as primary"
                    >
                      {primaryId === image.id ? (
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Star size={14} />
                      )}
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="p-3">
                  <p
                    className="truncate text-xs font-medium text-gray-700"
                    title={image.altText || ""}
                  >
                    {image.altText ||
                      "No alt text"}
                  </p>

                  <p className="mt-1 text-[11px] text-gray-400">
                    Order: {image.sortOrder}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEdit(image)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition ui-btn-outline"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(image)
                      }
                      disabled={
                        deleting === image.id
                      }
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-2.5 py-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50 ui-btn-danger"
                      title="Delete"
                    >
                      {deleting === image.id ? (
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editingImage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  {editingImage
                    ? "Edit Product Image"
                    : "Add Product Image"}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Enter the image details below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 ui-btn-outline"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Image URL
                  </label>

                  <input
                    type="url"
                    name="url"
                    value={form.url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {form.url && (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={form.url}
                      alt="Preview"
                      className="h-40 w-full object-contain"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Alt Text
                  </label>

                  <input
                    type="text"
                    name="altText"
                    value={form.altText}
                    onChange={handleChange}
                    placeholder="Product front view"
                    maxLength={255}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Sort Order
                    </label>

                    <input
                      type="number"
                      name="sortOrder"
                      value={form.sortOrder}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                    <input
                      type="checkbox"
                      name="isPrimary"
                      checked={form.isPrimary}
                      onChange={handleChange}
                      className="h-4 w-4 accent-orange-500"
                    />

                    <span className="text-xs font-medium text-gray-700">
                      Set as primary
                    </span>
                  </label>
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
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ui-btn-primary"
                >
                  {saving && (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingImage
                    ? "Update Image"
                    : "Add Image"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImages;