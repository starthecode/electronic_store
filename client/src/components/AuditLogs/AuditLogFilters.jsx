import {
  CalendarDays,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";

const ACTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "STATUS_CHANGE", label: "Status Change" },
  {
    value: "STOCK_ADJUSTMENT",
    label: "Stock Adjustment",
  },
  {
    value: "PASSWORD_CHANGE",
    label: "Password Change",
  },
];

const AuditLogFilters = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Search */}
        <div className="relative lg:col-span-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onChange("search", e.target.value)
            }
            placeholder="Search entity or description..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {/* Action */}
        <div className="lg:col-span-2">
          <select
            value={filters.action}
            onChange={(e) =>
              onChange("action", e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="">All Actions</option>

            {ACTIONS.map((action) => (
              <option
                key={action.value}
                value={action.value}
              >
                {action.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entity */}
        <div className="lg:col-span-2">
          <input
            type="text"
            value={filters.entity}
            onChange={(e) =>
              onChange("entity", e.target.value)
            }
            placeholder="Entity"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {/* From */}
        <div className="relative lg:col-span-2">
          <CalendarDays
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="date"
            value={filters.from}
            onChange={(e) =>
              onChange("from", e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          />
        </div>

        {/* To */}
        <div className="relative lg:col-span-2">
          <CalendarDays
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) =>
              onChange("to", e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Filter size={14} />
          <span>
            Filter audit activity by action, entity and date
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default AuditLogFilters;