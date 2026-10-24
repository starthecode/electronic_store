import {
  Filter,
  Search,
  X,
} from "lucide-react";

const CustomerFilters = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
}) => {
  const hasFilters =
    search || status;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
            placeholder="Search customer name, email or phone..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value)
          }
          className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-gray-400"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium ui-btn-outline"
          >
            <X size={16} />
            Reset
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <Filter size={14} />
        <span>
          Filter customers by status and search
        </span>
      </div>
    </div>
  );
};

export default CustomerFilters;