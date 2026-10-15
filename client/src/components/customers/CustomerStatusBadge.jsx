const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-600",
  },
  INACTIVE: {
    label: "Inactive",
    className:
      "border-gray-200 bg-gray-50 text-gray-600",
  },
  SUSPENDED: {
    label: "Suspended",
    className:
      "border-red-200 bg-red-50 text-red-600",
  },
};

const CustomerStatusBadge = ({ status }) => {
  const config =
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.INACTIVE;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "border px-2.5 py-1 text-xs font-medium",
        config.className,
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
};

export default CustomerStatusBadge;