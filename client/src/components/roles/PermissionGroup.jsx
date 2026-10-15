import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  ShoppingCart,
  CreditCard,
  Users,
  Percent,
  Settings,
  FileText,
  Link2,
} from "lucide-react";

const groups = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    prefixes: ["dashboard."],
  },
  {
    label: "Products",
    icon: Package,
    prefixes: [
      "products.",
      "categories.",
      "brands.",
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    prefixes: ["inventory."],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    prefixes: ["orders."],
  },
  {
    label: "Payments",
    icon: CreditCard,
    prefixes: ["payments."],
  },
  {
    label: "Customers",
    icon: Users,
    prefixes: ["customers."],
  },
  {
    label: "Discounts",
    icon: Percent,
    prefixes: ["discounts."],
  },
  {
    label: "Users & Roles",
    icon: Users,
    prefixes: ["users."],
  },
  {
    label: "Settings",
    icon: Settings,
    prefixes: ["settings."],
  },
  {
    label: "Audit Logs",
    icon: FileText,
    prefixes: ["audit_logs."],
  },
  {
    label: "Affiliate",
    icon: Link2,
    prefixes: ["affiliate_reports."],
  },
];

const PermissionGroup = ({
  permissions,
  selectedIds,
  onToggle,
}) => {
  const getGroupPermissions = (prefixes) =>
    permissions.filter((permission) =>
      prefixes.some((prefix) =>
        permission.name.startsWith(prefix)
      )
    );

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupPermissions =
          getGroupPermissions(group.prefixes);

        if (!groupPermissions.length) {
          return null;
        }

        const Icon = group.icon;

        const allSelected =
          groupPermissions.every((permission) =>
            selectedIds.includes(permission.id)
          );

        const toggleGroup = () => {
          if (allSelected) {
            groupPermissions.forEach(
              (permission) => {
                if (
                  selectedIds.includes(
                    permission.id
                  )
                ) {
                  onToggle(permission.id);
                }
              }
            );
          } else {
            groupPermissions.forEach(
              (permission) => {
                if (
                  !selectedIds.includes(
                    permission.id
                  )
                ) {
                  onToggle(permission.id);
                }
              }
            );
          }
        };

        return (
          <div
            key={group.label}
            className="rounded-xl border border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon
                  size={17}
                  className="text-gray-500"
                />

                <span className="text-sm font-medium text-gray-900">
                  {group.label}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleGroup}
                className="text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                {allSelected
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1 p-3 md:grid-cols-2">
              {groupPermissions.map(
                (permission) => {
                  const checked =
                    selectedIds.includes(
                      permission.id
                    );

                  return (
                    <label
                      key={permission.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition ${
                        checked
                          ? "bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onToggle(
                            permission.id
                          )
                        }
                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                      />

                      <span>
                        <span className="block text-sm text-gray-800">
                          {permission.name}
                        </span>

                        {permission.description && (
                          <span className="mt-0.5 block text-xs text-gray-400">
                            {
                              permission.description
                            }
                          </span>
                        )}
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionGroup;