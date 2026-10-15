import {
  ArrowLeft,
  CalendarDays,
  Edit,
  Layers3,
  Package,
  Percent,
  RefreshCw,
  Tag,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getDiscount,
} from "../../../services/discount.service";

import DiscountStatusBadge from "../../../components/discounts/DiscountStatusBadge";
import DiscountProducts from "../../../components/discounts/DiscountProducts";
import DiscountCategories from "../../../components/discounts/DiscountCategories";
import DiscountUsage from "../../../components/discounts/DiscountUsage";

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatDate = (value, includeTime = false) => {
  if (!value) return "No expiry";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(new Date(value));
};

const getDiscountValue = (discount) => {
  if (discount.type === "PERCENTAGE") {
    return `${Number(discount.value)}%`;
  }

  return formatMoney(discount.value);
};

export default function DiscountDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [discount, setDiscount] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("overview");

  const [notice, setNotice] =
    useState(
      location.state?.message || ""
    );

  const loadDiscount = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await getDiscount(id);

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to load discount"
        );
      }

      setDiscount(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load discount"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiscount();

    if (location.state?.message) {
      window.history.replaceState(
        {},
        document.title
      );
    }
  }, [id]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [notice]);

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (error || !discount) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/discounts")
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Discounts
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {error || "Discount not found."}
          </p>

          <button
            type="button"
            onClick={() => loadDiscount()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const productCount =
    Number(
      discount._count?.products || 0
    );

  const categoryCount =
    Number(
      discount._count?.categories || 0
    );

  const usageCount =
    Number(
      discount.usageCount || 0
    );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/admin/discounts")
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Discounts
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Tag size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  {discount.name}
                </h1>

                <DiscountStatusBadge
                  status={discount.status}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-gray-700">
                  {discount.code}
                </code>

                <span className="text-sm text-gray-400">
                  ·
                </span>

                <span className="text-sm text-gray-500">
                  {getDiscountValue(
                    discount
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              loadDiscount(true)
            }
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/admin/discounts/${id}/edit`
              )
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-black"
          >
            <Edit size={16} />
            Edit Discount
          </button>
        </div>
      </div>

      {/* Success notice */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Percent size={18} />}
          label="Discount Value"
          value={getDiscountValue(
            discount
          )}
          description={
            discount.type ===
            "PERCENTAGE"
              ? "Percentage discount"
              : "Fixed amount discount"
          }
        />

        <SummaryCard
          icon={<Users size={18} />}
          label="Usage"
          value={
            discount.usageLimit
              ? `${usageCount} / ${discount.usageLimit}`
              : `${usageCount}`
          }
          description={
            discount.usageLimit
              ? "Usage limit"
              : "Unlimited usage"
          }
        />

        <SummaryCard
          icon={<Package size={18} />}
          label="Products"
          value={productCount}
          description={
            productCount === 1
              ? "Assigned product"
              : "Assigned products"
          }
        />

        <SummaryCard
          icon={<Layers3 size={18} />}
          label="Categories"
          value={categoryCount}
          description={
            categoryCount === 1
              ? "Assigned category"
              : "Assigned categories"
          }
        />
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max px-2">
            <TabButton
              active={
                activeTab === "overview"
              }
              onClick={() =>
                setActiveTab("overview")
              }
            >
              Overview
            </TabButton>

            <TabButton
              active={
                activeTab === "products"
              }
              onClick={() =>
                setActiveTab("products")
              }
              count={productCount}
            >
              Products
            </TabButton>

            <TabButton
              active={
                activeTab === "categories"
              }
              onClick={() =>
                setActiveTab("categories")
              }
              count={categoryCount}
            >
              Categories
            </TabButton>

            <TabButton
              active={
                activeTab === "usage"
              }
              onClick={() =>
                setActiveTab("usage")
              }
              count={usageCount}
            >
              Usage
            </TabButton>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === "overview" && (
            <OverviewTab
              discount={discount}
            />
          )}

          {activeTab === "products" && (
            <DiscountProducts
              discount={discount}
              onChanged={loadDiscount}
            />
          )}

          {activeTab === "categories" && (
            <DiscountCategories
              discount={discount}
              onChanged={loadDiscount}
            />
          )}

          {activeTab === "usage" && (
            <DiscountUsage
              discount={discount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ discount }) {
  return (
    <div className="space-y-8">
      <DetailSection
        title="Discount Information"
        description="Core configuration for this promotion."
      >
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Discount Name"
            value={discount.name}
          />

          <DetailItem
            label="Discount Code"
            value={
              <code className="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm">
                {discount.code}
              </code>
            }
          />

          <DetailItem
            label="Type"
            value={
              discount.type ===
              "PERCENTAGE"
                ? "Percentage"
                : "Fixed Amount"
            }
          />

          <DetailItem
            label="Value"
            value={
              <span className="font-semibold">
                {getDiscountValue(
                  discount
                )}
              </span>
            }
          />

          <DetailItem
            label="Scope"
            value={
              <ScopeLabel
                scope={discount.scope}
              />
            }
          />

          <DetailItem
            label="Status"
            value={
              <DiscountStatusBadge
                status={discount.status}
              />
            }
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Conditions"
        description="Rules that control when the discount can be applied."
      >
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Minimum Amount"
            value={
              discount.minimumAmount !=
              null
                ? formatMoney(
                    discount.minimumAmount
                  )
                : "No minimum"
            }
          />

          <DetailItem
            label="Maximum Discount"
            value={
              discount.maximumDiscount !=
              null
                ? formatMoney(
                    discount.maximumDiscount
                  )
                : "No maximum"
            }
          />

          <DetailItem
            label="Usage"
            value={
              discount.usageLimit
                ? `${Number(
                    discount.usageCount || 0
                  )} / ${
                    discount.usageLimit
                  }`
                : `${Number(
                    discount.usageCount || 0
                  )} / Unlimited`
            }
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Validity"
        description="Availability period for this discount."
      >
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <DetailItem
            icon={
              <CalendarDays size={16} />
            }
            label="Starts"
            value={formatDate(
              discount.startsAt,
              true
            )}
          />

          <DetailItem
            icon={
              <CalendarDays size={16} />
            }
            label="Expires"
            value={
              discount.expiresAt
                ? formatDate(
                    discount.expiresAt,
                    true
                  )
                : "No expiry"
            }
          />
        </div>
      </DetailSection>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {label}
        </p>

        <p className="mt-1 text-xl font-semibold text-gray-900">
          {value}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-4 text-sm font-medium transition ${
        active
          ? "text-gray-900"
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      <span className="flex items-center gap-2">
        {children}

        {count !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              active
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {count}
          </span>
        )}
      </span>

      {active && (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gray-900" />
      )}
    </button>
  );
}

function DetailSection({
  title,
  description,
  children,
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
        {icon}
        {label}
      </div>

      <div className="mt-2 text-sm text-gray-800">
        {value}
      </div>
    </div>
  );
}

function ScopeLabel({ scope }) {
  const labels = {
    ORDER: "Entire Order",
    PRODUCT: "Specific Products",
    CATEGORY: "Specific Categories",
  };

  return (
    <span>
      {labels[scope] || scope}
    </span>
  );
}

function DetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      <div className="h-5 w-32 rounded bg-gray-100" />

      <div className="flex justify-between">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-gray-100" />
          <div className="h-5 w-40 rounded bg-gray-100" />
        </div>

        <div className="h-11 w-32 rounded-xl bg-gray-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl bg-gray-100"
            />
          )
        )}
      </div>

      <div className="h-[500px] rounded-2xl bg-gray-100" />
    </div>
  );
}