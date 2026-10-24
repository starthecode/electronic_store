import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Image,
  MessageSquareQuote,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  createHomepageSlide,
  createHomepageTestimonial,
  deleteHomepageSlide,
  deleteHomepageTestimonial,
  getHomepageSlides,
  getHomepageTestimonials,
  reorderHomepageSlides,
  reorderHomepageTestimonials,
  updateHomepageSlide,
  updateHomepageTestimonial,
} from "../../services/homepageTemplate.service";

const inputClass =
  "mt-1 block min-h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const labelClass = "block text-sm font-medium text-gray-700";

const slideDefaults = {
  brandName: "",
  title: "",
  titleHighlight: "",
  description: "",
  featureBullets: "",
  specText: "",
  priceLabel: "",
  price: "",
  variantLabels: "",
  buttonLabel: "Shop Now",
  buttonUrl: "/shop",
  imageUrl: "",
  mobileImageUrl: "",
  backgroundImageUrl: "",
  backgroundColor: "",
  sortOrder: 0,
  isActive: true,
};

const testimonialDefaults = {
  customerName: "",
  customerRole: "",
  text: "",
  rating: 5,
  avatarUrl: "",
  sortOrder: 0,
  isActive: true,
};

const messageFor = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const validImageUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const validDestination = (value) => {
  if (value.startsWith("/") && !value.startsWith("//")) {
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(value)) return false;
    try {
      return new URL(value, "https://magdeal.invalid").origin ===
        "https://magdeal.invalid";
    } catch {
      return false;
    }
  }
  return validImageUrl(value);
};

const linesFromList = (value) =>
  Array.isArray(value) ? value.join("\n") : "";

const listFromLines = (value) =>
  value.split("\n").map((item) => item.trim()).filter(Boolean);

function ImagePreview({ src, alt, className }) {
  const [failedSrc, setFailedSrc] = useState("");

  return src && failedSrc !== src ? (
    <img
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={className}
      loading="lazy"
    />
  ) : (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
      <Image size={24} aria-hidden="true" />
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  );
}

export default function TemplateEditor() {
  const [tab, setTab] = useState("slides");
  const [slides, setSlides] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(slideDefaults);

  const items = tab === "slides" ? slides : testimonials;
  const setItems = tab === "slides" ? setSlides : setTestimonials;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = tab === "slides"
        ? await getHomepageSlides()
        : await getHomepageTestimonials();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(messageFor(err, "Unable to load homepage content."));
    } finally {
      setLoading(false);
    }
  }, [tab, setItems]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const beginCreate = () => {
    setError("");
    setNotice("");
    setEditor({ id: null });
    setForm({
      ...(tab === "slides" ? slideDefaults : testimonialDefaults),
      sortOrder: items.length,
    });
  };

  const beginEdit = (item) => {
    setError("");
    setNotice("");
    setEditor({ id: item.id });
    setForm(tab === "slides"
      ? {
          brandName: item.brandName ?? "",
          title: item.title ?? "",
          titleHighlight: item.titleHighlight ?? "",
          description: item.description ?? "",
          featureBullets: linesFromList(item.featureBullets),
          specText: item.specText ?? "",
          priceLabel: item.priceLabel ?? "",
          price: item.price ?? "",
          variantLabels: linesFromList(item.variantLabels),
          buttonLabel: item.buttonLabel ?? "",
          buttonUrl: item.buttonUrl ?? "",
          imageUrl: item.imageUrl ?? "",
          mobileImageUrl: item.mobileImageUrl ?? "",
          backgroundImageUrl: item.backgroundImageUrl ?? "",
          backgroundColor: item.backgroundColor ?? "",
          sortOrder: item.sortOrder ?? 0,
          isActive: Boolean(item.isActive),
        }
      : {
          customerName: item.customerName ?? "",
          customerRole: item.customerRole ?? "",
          text: item.text ?? "",
          rating: item.rating ?? 5,
          avatarUrl: item.avatarUrl ?? "",
          sortOrder: item.sortOrder ?? 0,
          isActive: Boolean(item.isActive),
        });
  };

  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (tab === "slides") {
      if (!validDestination(form.buttonUrl.trim())) {
        setError("Use a storefront path such as /shop or a valid HTTP/HTTPS destination URL.");
        return;
      }
      if (
        !validImageUrl(form.imageUrl.trim()) ||
        (form.mobileImageUrl.trim() &&
          !validImageUrl(form.mobileImageUrl.trim())) ||
        (form.backgroundImageUrl.trim() &&
          !validImageUrl(form.backgroundImageUrl.trim()))
      ) {
        setError("Product, mobile, and background images must use valid HTTP or HTTPS URLs.");
        return;
      }
      if (
        form.backgroundColor &&
        !/^#[0-9a-fA-F]{6}$/.test(form.backgroundColor)
      ) {
        setError("Background color must be a six-digit hex color.");
        return;
      }
    } else if (
      form.avatarUrl.trim() &&
      !validImageUrl(form.avatarUrl.trim())
    ) {
      setError("Avatar image must use a valid HTTP or HTTPS URL.");
      return;
    }

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      ...(tab === "slides"
        ? {
            brandName: form.brandName.trim() || null,
            title: form.title.trim(),
            titleHighlight: form.titleHighlight.trim() || null,
            description: form.description.trim(),
            featureBullets: listFromLines(form.featureBullets),
            specText: form.specText.trim() || null,
            priceLabel: form.priceLabel.trim() || null,
            price: form.price.trim() || null,
            variantLabels: listFromLines(form.variantLabels),
            buttonLabel: form.buttonLabel.trim(),
            buttonUrl: form.buttonUrl.trim(),
            imageUrl: form.imageUrl.trim(),
            mobileImageUrl: form.mobileImageUrl.trim() || null,
            backgroundImageUrl: form.backgroundImageUrl.trim() || null,
            backgroundColor: form.backgroundColor.trim() || null,
          }
        : {
            customerName: form.customerName.trim(),
            customerRole: form.customerRole.trim(),
            text: form.text.trim(),
            rating: Number(form.rating),
            avatarUrl: form.avatarUrl.trim() || null,
          }),
    };

    setSaving(true);
    try {
      if (tab === "slides") {
        if (editor.id) await updateHomepageSlide(editor.id, payload);
        else await createHomepageSlide(payload);
      } else if (editor.id) {
        await updateHomepageTestimonial(editor.id, payload);
      } else {
        await createHomepageTestimonial(payload);
      }
      setEditor(null);
      setNotice(tab === "slides" ? "Homepage slide saved." : "Testimonial saved.");
      await load();
    } catch (err) {
      setError(messageFor(err, "Unable to save homepage content."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const itemName = tab === "slides" ? item.title : item.customerName;
    if (!window.confirm(`Permanently delete "${itemName}"?`)) return;

    setError("");
    setNotice("");
    try {
      if (tab === "slides") await deleteHomepageSlide(item.id);
      else await deleteHomepageTestimonial(item.id);
      setNotice(tab === "slides" ? "Homepage slide deleted." : "Testimonial deleted.");
      await load();
    } catch (err) {
      setError(messageFor(err, "Unable to delete homepage content."));
    }
  };

  const toggleActive = async (item) => {
    setError("");
    setNotice("");
    try {
      const update = { isActive: !item.isActive };
      if (tab === "slides") await updateHomepageSlide(item.id, update);
      else await updateHomepageTestimonial(item.id, update);
      setNotice(item.isActive ? "Content deactivated." : "Content activated.");
      await load();
    } catch (err) {
      setError(messageFor(err, "Unable to update content status."));
    }
  };

  const move = async (index, offset) => {
    const destination = index + offset;
    if (destination < 0 || destination >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[destination]] = [
      reordered[destination],
      reordered[index],
    ];
    setError("");
    setNotice("");
    try {
      const ids = reordered.map((item) => item.id);
      const response = tab === "slides"
        ? await reorderHomepageSlides(ids)
        : await reorderHomepageTestimonials(ids);
      setItems(Array.isArray(response) ? response : reordered);
      setNotice("Display order saved.");
    } catch (err) {
      setError(messageFor(err, "Unable to save display order."));
      await load();
    }
  };

  const updateTab = (nextTab) => {
    setEditor(null);
    setError("");
    setNotice("");
    setTab(nextTab);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Template Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the homepage hero slider and customer testimonials.
          </p>
        </div>
        <button
          type="button"
          onClick={beginCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ui-btn-primary"
        >
          <Plus size={17} />
          Add {tab === "slides" ? "slide" : "testimonial"}
        </button>
      </header>

      <div className="flex gap-2 border-b border-gray-200" role="tablist" aria-label="Homepage content">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "slides"}
          onClick={() => updateTab("slides")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
            tab === "slides"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Image size={17} />
          Homepage Slider
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "testimonials"}
          onClick={() => updateTab("testimonials")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
            tab === "testimonials"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <MessageSquareQuote size={17} />
          Customer Testimonials
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading homepage content...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
          <p className="text-sm text-gray-600">
            No {tab === "slides" ? "homepage slides" : "testimonials"} have been created.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            The storefront keeps its existing hero fallback until an active slide is available.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
            >
              <ImagePreview
                src={tab === "slides" ? item.imageUrl : item.avatarUrl}
                alt={tab === "slides" ? item.title : item.customerName}
                className={tab === "slides"
                  ? "h-28 w-full shrink-0 rounded-xl object-cover sm:w-44"
                  : "h-20 w-20 shrink-0 rounded-full object-cover"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">
                    {tab === "slides" ? item.title : item.customerName}
                  </h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {tab === "slides" ? (
                  <>
                    {item.brandName && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{item.brandName}</p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {item.buttonLabel} · {item.buttonUrl}
                    </p>
                    {(item.priceLabel || item.price) && (
                      <p className="mt-1 text-xs font-medium text-gray-600">
                        {[item.priceLabel, item.price].filter(Boolean).join(" ")}
                      </p>
                    )}
                    {item.mobileImageUrl && (
                      <p className="mt-1 text-xs text-gray-400">Mobile image configured</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-500">{item.customerRole}</p>
                    <div className="mt-1 flex items-center gap-1 text-amber-500" aria-label={`${item.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, star) => (
                        <Star key={star} size={14} fill={star < item.rating ? "currentColor" : "none"} />
                      ))}
                      <span className="ml-1 text-xs text-gray-500">{item.rating}/5</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.text}</p>
                  </>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Order {item.sortOrder} · Created {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("en-IN")
                    : "—"} · Updated {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="rounded-lg border p-2 disabled:opacity-40 ui-btn-outline"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label="Move down"
                    className="rounded-lg border p-2 disabled:opacity-40 ui-btn-outline"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(item)}
                  className="min-h-9 rounded-lg border px-3 text-xs font-medium ui-btn-outline"
                >
                  {item.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => beginEdit(item)}
                  aria-label="Edit"
                  className="rounded-lg border p-2 ui-btn-outline"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label="Delete"
                  className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 ui-btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-form-heading"
            className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-2xl sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="template-form-heading" className="text-lg font-semibold text-gray-900">
                  {editor.id ? "Edit" : "Create"} {tab === "slides" ? "homepage slide" : "testimonial"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Preview images use an existing public image URL. No image is uploaded here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                aria-label="Close editor"
                className="rounded-lg p-2 ui-btn-outline"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">
              {tab === "slides" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Brand name (optional)">
                      <input className={inputClass} maxLength={100} value={form.brandName} onChange={(event) => updateField("brandName", event.target.value)} />
                    </FormField>
                    <FormField label="Highlighted title text (optional)">
                      <input className={inputClass} maxLength={150} value={form.titleHighlight} onChange={(event) => updateField("titleHighlight", event.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Title">
                    <input className={inputClass} required maxLength={150} value={form.title} onChange={(event) => updateField("title", event.target.value)} />
                  </FormField>
                  <FormField label="Description">
                    <textarea className={inputClass} required rows={3} maxLength={1500} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
                  </FormField>
                  <FormField label="Feature bullets (optional, one per line)">
                    <textarea className={inputClass} rows={3} placeholder={"Multitasking made simple\nImmersive viewing experience"} value={form.featureBullets} onChange={(event) => updateField("featureBullets", event.target.value)} />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="Specifications / storage text (optional)">
                      <input className={inputClass} maxLength={180} placeholder="256GB + 12GB" value={form.specText} onChange={(event) => updateField("specText", event.target.value)} />
                    </FormField>
                    <FormField label="Price label (optional)">
                      <input className={inputClass} maxLength={60} placeholder="BDT" value={form.priceLabel} onChange={(event) => updateField("priceLabel", event.target.value)} />
                    </FormField>
                    <FormField label="Price (optional)">
                      <input className={inputClass} maxLength={60} placeholder="285,999" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Color or variant labels (optional, one per line)">
                    <textarea className={inputClass} rows={2} placeholder={"Graygreen\nPhantom Black\nBeige"} value={form.variantLabels} onChange={(event) => updateField("variantLabels", event.target.value)} />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Button label">
                      <input className={inputClass} required maxLength={60} value={form.buttonLabel} onChange={(event) => updateField("buttonLabel", event.target.value)} />
                    </FormField>
                    <FormField label="Button destination URL or route">
                      <input className={inputClass} required maxLength={2048} placeholder="/shop or https://example.com" value={form.buttonUrl} onChange={(event) => updateField("buttonUrl", event.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Desktop / primary image URL">
                    <input className={inputClass} required type="url" maxLength={2048} value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} />
                  </FormField>
                  {form.imageUrl && (
                    <ImagePreview src={form.imageUrl} alt="Desktop slide preview" className="h-40 w-full rounded-xl object-cover" />
                  )}
                  <FormField label="Optional mobile image URL">
                    <input className={inputClass} type="url" maxLength={2048} value={form.mobileImageUrl} onChange={(event) => updateField("mobileImageUrl", event.target.value)} />
                  </FormField>
                  {form.mobileImageUrl && (
                    <ImagePreview src={form.mobileImageUrl} alt="Mobile slide preview" className="h-40 w-full rounded-xl object-cover sm:max-w-xs" />
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Optional background image URL">
                      <input className={inputClass} type="url" maxLength={2048} value={form.backgroundImageUrl} onChange={(event) => updateField("backgroundImageUrl", event.target.value)} />
                    </FormField>
                    <FormField label="Optional background color">
                      <div className="mt-1 flex gap-2">
                        <input className="h-10 w-14 rounded-lg border border-gray-200 p-1" type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.backgroundColor) ? form.backgroundColor : "#ffffff"} onChange={(event) => updateField("backgroundColor", event.target.value)} aria-label="Choose background color" />
                        <input className={`${inputClass} mt-0`} maxLength={7} placeholder="#ffffff" value={form.backgroundColor} onChange={(event) => updateField("backgroundColor", event.target.value)} />
                      </div>
                    </FormField>
                  </div>
                  {form.backgroundImageUrl && (
                    <ImagePreview src={form.backgroundImageUrl} alt="Background image preview" className="h-32 w-full rounded-xl object-cover" />
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Customer name">
                      <input className={inputClass} required maxLength={120} value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} />
                    </FormField>
                    <FormField label="Role or designation">
                      <input className={inputClass} required maxLength={150} value={form.customerRole} onChange={(event) => updateField("customerRole", event.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Testimonial">
                    <textarea className={inputClass} required rows={4} maxLength={2000} value={form.text} onChange={(event) => updateField("text", event.target.value)} />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Star rating">
                      <select className={inputClass} value={form.rating} onChange={(event) => updateField("rating", Number(event.target.value))}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>
                        ))}
                      </select>
                      <span className="mt-2 flex items-center gap-1 text-amber-500" aria-label={`${form.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, star) => (
                          <Star key={star} size={16} fill={star < form.rating ? "currentColor" : "none"} />
                        ))}
                      </span>
                    </FormField>
                    <FormField label="Optional customer avatar URL">
                      <input className={inputClass} type="url" maxLength={2048} value={form.avatarUrl} onChange={(event) => updateField("avatarUrl", event.target.value)} />
                      {form.avatarUrl && (
                        <ImagePreview src={form.avatarUrl} alt="Customer avatar preview" className="mt-2 h-16 w-16 rounded-full object-cover" />
                      )}
                    </FormField>
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Display order">
                  <input className={inputClass} type="number" min="0" max="10000" required value={form.sortOrder} onChange={(event) => updateField("sortOrder", event.target.value)} />
                </FormField>
                <label className="flex min-h-10 items-center gap-3 self-end rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} className="h-4 w-4 accent-orange-500" />
                  Active on storefront
                </label>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="min-h-10 rounded-xl border px-4 text-sm font-medium ui-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium disabled:opacity-60 ui-btn-primary"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
