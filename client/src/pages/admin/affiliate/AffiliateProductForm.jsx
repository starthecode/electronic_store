import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Save,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAffiliateProduct,
  getAffiliateProduct,
  updateAffiliateProduct,
  getAffiliateMarketplaces,
  getCategoriesForAffiliate,
  getBrandsForAffiliate,
} from "../../../services/affiliate.service";

const initial = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  imageUrls: [],
  categoryId: "",
  brandId: "",
  marketplaceId: "",
  externalProductId: "",
  productUrl: "",
  affiliateUrl: "",
  displayPrice: "",
  status: "ACTIVE",
};

const parseLegacyImageUrls = (imageUrl) =>
  (() => {
    if (!imageUrl?.trim()) return [];
    const value = imageUrl.trim();
    const parts = value.split(/,(?=\s*https?:\/\/)/i);
    if (parts.length < 2) return [value];
    const ambiguous = parts.slice(0, -1).some((part) => {
      if (/\s$/.test(part)) return false;
      try {
        const parsed = new URL(part.trim());
        return (
          parsed.search.includes(",") ||
          parsed.hash.includes(",") ||
          !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(parsed.pathname)
        );
      } catch {
        return true;
      }
    });
    return ambiguous ? [value] : parts.map((part) => part.trim());
  })();

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

function ImagePreview({ url, name }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
        Preview unavailable
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${name} preview`}
      onError={() => setFailed(true)}
      className="aspect-square w-full rounded-lg bg-gray-100 object-contain p-2"
    />
  );
}

export default function AffiliateProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [form, setForm] = useState(initial);
  const [marketplaces, setMarketplaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getAffiliateMarketplaces({ status: "ACTIVE" }),
      getCategoriesForAffiliate(),
      getBrandsForAffiliate(),
    ])
      .then(([marketplaceOptions, categoryOptions, brandOptions]) => {
        setMarketplaces(
          Array.isArray(marketplaceOptions) ? marketplaceOptions : []
        );
        setCategories(categoryOptions);
        setBrands(brandOptions);
      })
      .catch((err) =>
        setError(
          err?.response?.data?.message || "Unable to load form options."
        )
      );
  }, []);

  useEffect(() => {
    if (!editing) return;

    getAffiliateProduct(id)
      .then((product) =>
        setForm({
          name: product.name ?? "",
          slug: product.slug ?? "",
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          imageUrls:
            Array.isArray(product.imageUrls) && product.imageUrls.length
              ? product.imageUrls
              : parseLegacyImageUrls(product.imageUrl),
          categoryId: product.categoryId ?? product.category?.id ?? "",
          brandId: product.brandId ?? product.brand?.id ?? "",
          marketplaceId:
            product.marketplaceId ?? product.marketplace?.id ?? "",
          externalProductId: product.externalProductId ?? "",
          productUrl: product.productUrl ?? "",
          affiliateUrl: product.affiliateUrl ?? "",
          displayPrice:
            product.displayPrice == null ? "" : String(product.displayPrice),
          status: product.status ?? "ACTIVE",
        })
      )
      .catch((err) =>
        setError(
          err?.response?.data?.message || "Unable to load affiliate product."
        )
      )
      .finally(() => setLoading(false));
  }, [editing, id]);

  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateImage = (index, value) =>
    setForm((current) => ({
      ...current,
      imageUrls: current.imageUrls.map((url, imageIndex) =>
        imageIndex === index ? value : url
      ),
    }));

  const moveImage = (index, offset) => {
    setForm((current) => {
      const destination = index + offset;
      if (destination < 0 || destination >= current.imageUrls.length) {
        return current;
      }

      const imageUrls = [...current.imageUrls];
      [imageUrls[index], imageUrls[destination]] = [
        imageUrls[destination],
        imageUrls[index],
      ];
      return { ...current, imageUrls };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.slug.trim() ||
      !form.marketplaceId ||
      !form.affiliateUrl.trim()
    ) {
      setError("Name, slug, marketplace and affiliate URL are required.");
      return;
    }

    const imageUrls = form.imageUrls
      .map((url) => url.trim())
      .filter(Boolean);
    if (imageUrls.some((url) => !isHttpUrl(url))) {
      setError("Every image URL must be a valid HTTP or HTTPS URL.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        marketplaceId: form.marketplaceId,
        affiliateUrl: form.affiliateUrl.trim(),
        status: form.status,
        imageUrls,
        ...(form.shortDescription.trim()
          ? { shortDescription: form.shortDescription.trim() }
          : {}),
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
        ...(form.categoryId ? { categoryId: form.categoryId } : {}),
        ...(form.brandId ? { brandId: form.brandId } : {}),
        ...(form.externalProductId.trim()
          ? { externalProductId: form.externalProductId.trim() }
          : {}),
        ...(form.productUrl.trim()
          ? { productUrl: form.productUrl.trim() }
          : {}),
        ...(form.displayPrice !== ""
          ? { displayPrice: Number(form.displayPrice) }
          : {}),
      };

      if (editing) {
        await updateAffiliateProduct(id, payload);
      } else {
        await createAffiliateProduct(payload);
      }
      navigate("/admin/affiliate/products");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to save affiliate product."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-gray-500">
        Loading...
      </div>
    );
  }

  const input = (key, label, type = "text", placeholder = "") => (
    <label className="text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-orange-400"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => navigate("/admin/affiliate/products")}
        className="inline-flex items-center gap-2 text-sm font-medium ui-btn-outline"
      >
        <ArrowLeft size={16} /> Back to Affiliate Products
      </button>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {editing ? "Edit Affiliate Product" : "Add Affiliate Product"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure product information and its external affiliate destination.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold">Basic Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            {input("name", "Product Name *", "text", "Product name")}
            {input("slug", "Slug *", "text", "product-name")}
            <label className="text-sm font-medium text-gray-700">
              Marketplace *
              <select
                value={form.marketplaceId}
                onChange={(event) => set("marketplaceId", event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border px-3"
              >
                <option value="">Select marketplace</option>
                {marketplaces.map((marketplace) => (
                  <option key={marketplace.id} value={marketplace.id}>
                    {marketplace.name}
                  </option>
                ))}
              </select>
            </label>
            {input("externalProductId", "External Product ID")}
            {input("displayPrice", "Display Price", "number", "49999")}
            <label className="text-sm font-medium text-gray-700">
              Category
              <select
                value={form.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border px-3"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Brand
              <select
                value={form.brandId}
                onChange={(event) => set("brandId", event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border px-3"
              >
                <option value="">No brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Status
              <select
                value={form.status}
                onChange={(event) => set("status", event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border px-3"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-sm font-semibold">Links & Media</h2>
          <div className="mt-4 space-y-5">
            {input("affiliateUrl", "Affiliate URL *", "url", "https://...")}
            {input("productUrl", "Product URL", "url", "https://...")}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Product image gallery
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Add public HTTP or HTTPS image URLs. The first image is
                    used as the primary image.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    set("imageUrls", [...form.imageUrls, ""])
                  }
                  disabled={form.imageUrls.length >= 20}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium ui-btn-outline"
                >
                  <ImagePlus size={16} /> Add image
                </button>
              </div>

              {form.imageUrls.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {form.imageUrls.map((url, index) => (
                    <div
                      key={`${index}-${url}`}
                      className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-[112px_minmax(0,1fr)]"
                    >
                      <ImagePreview
                        key={`${index}-${url}`}
                        url={url.trim()}
                        name={form.name || "Affiliate product"}
                      />
                      <div className="min-w-0">
                        <label className="text-sm font-medium text-gray-700">
                          Image URL {index + 1}
                          {index === 0 && (
                            <span className="ml-2 text-xs font-normal text-orange-600">
                              Primary
                            </span>
                          )}
                          <input
                            type="url"
                            value={url}
                            onChange={(event) =>
                              updateImage(index, event.target.value)
                            }
                            placeholder="https://example.com/image.jpg"
                            className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-orange-400"
                          />
                        </label>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move image ${index + 1} up`}
                            className="rounded-lg border p-2 disabled:opacity-40 ui-btn-outline"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === form.imageUrls.length - 1}
                            aria-label={`Move image ${index + 1} down`}
                            className="rounded-lg border p-2 disabled:opacity-40 ui-btn-outline"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "imageUrls",
                                form.imageUrls.filter(
                                  (_image, imageIndex) => imageIndex !== index
                                )
                              )
                            }
                            aria-label={`Remove image ${index + 1}`}
                            className="rounded-lg border border-red-200 p-2 text-red-600 ui-btn-danger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  No images added.
                </p>
              )}
              <p className="mt-3 text-xs text-gray-400">
                External images are displayed from their source; MagDeal does
                not download or host them. You can add up to 20 images.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-sm font-semibold">Description</h2>
          <div className="mt-4 space-y-5">
            <label className="block text-sm font-medium">
              Short Description
              <textarea
                rows="3"
                value={form.shortDescription}
                onChange={(event) =>
                  set("shortDescription", event.target.value)
                }
                className="mt-2 w-full rounded-xl border px-3 py-3 outline-none focus:border-orange-400"
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                rows="6"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                className="mt-2 w-full rounded-xl border px-3 py-3 outline-none focus:border-orange-400"
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            onClick={() => navigate("/admin/affiliate/products")}
            className="h-10 rounded-xl border px-4 text-sm ui-btn-outline"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50 ui-btn-primary"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Affiliate Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
