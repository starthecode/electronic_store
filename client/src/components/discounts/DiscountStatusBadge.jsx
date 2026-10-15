const statusConfig = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  },

  INACTIVE: {
    label: "Inactive",
    className:
      "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
  },

  EXPIRED: {
    label: "Expired",
    className:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  },
};

export default function DiscountStatusBadge({
  status,
}) {
  const config =
    statusConfig[status] ||
    statusConfig.INACTIVE;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"
      />

      {config.label}
    </span>
  );
}