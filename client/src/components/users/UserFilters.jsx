import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

export default function UserFilters({
  search,
  setSearch,
  status,
  setStatus,
  roleId,
  setRoleId,
  roles,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search name, email or phone..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-900"
        >
          <option value="">
            All Status
          </option>
          <option value="ACTIVE">
            Active
          </option>
          <option value="INACTIVE">
            Inactive
          </option>
          <option value="SUSPENDED">
            Suspended
          </option>
        </select>

        <select
          value={roleId}
          onChange={(e) =>
            setRoleId(e.target.value)
          }
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-900"
        >
          <option value="">
            All Roles
          </option>

          {roles.map((role) => (
            <option
              key={role.id}
              value={role.id}
            >
              {formatRoleName(role.name)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <SlidersHorizontal size={14} />
        Filter users by status and role
      </div>
    </div>
  );
}

function formatRoleName(name = "") {
  return name
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}