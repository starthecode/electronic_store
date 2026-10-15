export default function AffiliateMarketplaceBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      {status}
    </span>
  );
}
