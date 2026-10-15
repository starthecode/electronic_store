export default function AffiliateProductStatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
