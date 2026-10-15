import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const TYPE_OPTIONS = [
  {
    value: "",
    label: "All Types",
  },
  {
    value: "PERCENTAGE",
    label: "Percentage",
  },
  {
    value: "FIXED_AMOUNT",
    label: "Fixed Amount",
  },
];

const SCOPE_OPTIONS = [
  {
    value: "",
    label: "All Scopes",
  },
  {
    value: "ORDER",
    label: "Order",
  },
  {
    value: "PRODUCT",
    label: "Product",
  },
  {
    value: "CATEGORY",
    label: "Category",
  },
];

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Status",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "EXPIRED",
    label: "Expired",
  },
];

export default function DiscountFilters({
  filters,
  onChange,
  onClear,
}) {
  const hasFilters =
    filters.search ||
    filters.type ||
    filters.scope ||
    filters.status;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onChange({
                search: e.target.value,
              })
            }
            placeholder="Search discount name or code..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
          />
        </div>

        {/* Type */}
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) =>
              onChange({
                type: e.target.value,
              })
            }
            className="h-11 min-w-[160px] appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-9 text-sm text-gray-700 outline-none focus:border-gray-900"
          >
            {TYPE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Scope */}
        <div className="relative">
          <select
            value={filters.scope}
            onChange={(e) =>
              onChange({
                scope: e.target.value,
              })
            }
            className="h-11 min-w-[150px] appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-9 text-sm text-gray-700 outline-none focus:border-gray-900"
          >
            {SCOPE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                status: e.target.value,
              })
            }
            className="h-11 min-w-[145px] appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-9 text-sm text-gray-700 outline-none focus:border-gray-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <SlidersHorizontal size={14} />
        Filter discounts by type, scope and status
      </div>
    </div>
  );
}