import {
  Bell,
  LogOut,
  Menu,
  UserCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../../store/slices/authSlice";

const AdminHeader = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    user,
    logoutLoading,
  } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());

    navigate("/admin/login", {
      replace: true,
    });
  };

  const userName =
    user?.name ||
    user?.fullName ||
    user?.email ||
    "Administrator";

  const roleName =
    user?.role?.name ||
    user?.roleName ||
    "Admin";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100"
        >
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2 border-l pl-3">
          <UserCircle
            size={32}
            className="text-gray-500"
          />

          <div className="hidden sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-gray-800">
              {userName}
            </p>

            <p className="text-xs text-gray-500">
              {roleName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;