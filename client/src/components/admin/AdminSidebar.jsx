import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  PanelsTopLeft,
  Percent,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  Warehouse,
  X,
  ChevronDown,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Template Editor",
    path: "/admin/templates",
    icon: PanelsTopLeft,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    path: "/admin/categories",
    icon: Boxes,
  },
  {
    label: "Brands",
    path: "/admin/brands",
    icon: Tags,
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: Warehouse,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Customers",
    path: "/admin/customers",
    icon: Users,
  },
  {
    label: "Discounts",
    path: "/admin/discounts",
    icon: Percent,
  },
  {
    label: "Payments",
    path: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Affiliate",
    path: "/admin/affiliate/reports",
    icon: BarChart3,
    children: [
      { label: "Reports", path: "/admin/affiliate/reports" },
      { label: "Marketplaces", path: "/admin/affiliate/marketplaces" },
      { label: "Products", path: "/admin/affiliate/products" },
    ],
  },
  {
    label: "Audit Logs",
    path: "/admin/audit-logs",
    icon: FileText,
  },
  {
    label: "Users & Roles",
    path: "/admin/users",
    icon: ClipboardList,
    children: [
      {
        label: "Users",
        path: "/admin/users",
      },
      {
        label: "Roles",
        path: "/admin/roles",
      },
    ],
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

const AdminSidebar = ({ open, onClose }) => {
  const location = useLocation();

  const usersRolesActive =
    location.pathname.startsWith(
      "/admin/users"
    ) ||
    location.pathname.startsWith(
      "/admin/roles"
    );

  const [usersRolesOpen, setUsersRolesOpen] =
    useState(usersRolesActive);

  useEffect(() => {
    if (usersRolesActive) {
      setUsersRolesOpen(true);
    }
  }, [usersRolesActive]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64
          flex-col border-r border-gray-200 bg-white
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${open
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Electronic Store
            </h1>

            <p className="text-xs text-gray-500">
              Admin Panel
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 lg:hidden ui-btn-outline"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            /*
             * Parent item with children
             */
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() =>
                      setUsersRolesOpen(
                        (current) => !current
                      )
                    }
                    className={`
                      flex w-full items-center gap-3
                      rounded-lg px-3 py-2.5
                      text-sm font-medium
                      transition-colors
                      ${usersRolesActive
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.8}
                    />

                    <span className="flex-1 text-left">
                      {item.label}
                    </span>

                    <ChevronDown
                      size={16}
                      strokeWidth={1.8}
                      className={`
                        transition-transform
                        ${usersRolesOpen
                          ? "rotate-180"
                          : ""
                        }
                      `}
                    />
                  </button>

                  {/* Nested items */}
                  {usersRolesOpen && (
                    <div className="relative ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3">
                      {item.children.map(
                        (child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            end={
                              child.path ===
                              "/admin/users" ||
                              child.path ===
                              "/admin/roles"
                            }
                            onClick={onClose}
                            className={({
                              isActive,
                            }) =>
                              [
                                "flex items-center rounded-lg px-3 py-2",
                                "text-sm transition-colors",
                                isActive
                                  ? "bg-orange-50 font-medium text-orange-600"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                              ].join(" ")
                            }
                          >
                            <span>
                              {child.label}
                            </span>
                          </NavLink>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            }

            /*
             * Normal menu item
             */
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path === "/admin"
                }
                onClick={onClose}
                className={({
                  isActive,
                }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  ].join(" ")
                }
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;