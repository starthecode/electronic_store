import {
  MousePointerClick,
  Users,
  Package,
  Store,
  MapPin,
  Megaphone,
  Globe2,
} from "lucide-react";

const cards = [
  ["totalClicks", "Total outbound clicks", MousePointerClick],
  ["uniqueVisitors", "Unique visitors", Users],
  ["coverage", "Countries / regions", MapPin],
  ["referralSources", "Referring sources", Globe2],
  ["campaigns", "UTM campaigns", Megaphone],
  ["activeProducts", "Active Products", Package],
  ["activeMarketplaces", "Active Marketplaces", Store],
];

export default function AffiliateStats({ data, loading }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([key, label, Icon]) => (
        <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {loading
                  ? "—"
                  : key === "coverage"
                    ? `${Number(data?.countries ?? 0).toLocaleString("en-IN")} / ${Number(data?.regions ?? 0).toLocaleString("en-IN")}`
                    : Number(data?.[key] ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
