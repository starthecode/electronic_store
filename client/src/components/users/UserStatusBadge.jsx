const styles = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE:
    "bg-gray-100 text-gray-600 border-gray-200",
  SUSPENDED:
    "bg-red-50 text-red-700 border-red-200",
};

const labels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

export default function UserStatusBadge({
  status,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        styles.INACTIVE
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {labels[status] || status}
    </span>
  );
}