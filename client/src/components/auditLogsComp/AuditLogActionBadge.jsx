const actionStyles = {
  CREATE: "bg-green-50 text-green-700 border-green-100",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-100",
  DELETE: "bg-red-50 text-red-700 border-red-100",
  LOGIN: "bg-purple-50 text-purple-700 border-purple-100",
  LOGOUT: "bg-gray-50 text-gray-700 border-gray-200",
  STATUS_CHANGE: "bg-orange-50 text-orange-700 border-orange-100",
  STOCK_ADJUSTMENT:
    "bg-yellow-50 text-yellow-700 border-yellow-100",
  PASSWORD_CHANGE:
    "bg-pink-50 text-pink-700 border-pink-100",
};

const actionLabels = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  LOGIN: "Login",
  LOGOUT: "Logout",
  STATUS_CHANGE: "Status Change",
  STOCK_ADJUSTMENT: "Stock Adjustment",
  PASSWORD_CHANGE: "Password Change",
};

const AuditLogActionBadge = ({ action }) => {
  const className =
    actionStyles[action] ||
    "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border",
        "px-2.5 py-1 text-xs font-medium",
        className,
      ].join(" ")}
    >
      {actionLabels[action] || action}
    </span>
  );
};

export default AuditLogActionBadge;