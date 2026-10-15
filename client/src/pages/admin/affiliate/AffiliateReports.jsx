import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getAffiliateOverview, getAffiliateProductReport, getAffiliateMarketplaceReport,
  getAffiliateTrends, getAffiliateMarketplaces, getCategoriesForAffiliate, getBrandsForAffiliate,
} from "../../../services/affiliate.service";
import AffiliateStats from "../../../components/affiliate/AffiliateStats";
import AffiliateTrendChart from "../../../components/affiliate/AffiliateTrendChart";
import AffiliateMarketplaceBadge from "../../../components/affiliate/AffiliateMarketplaceBadge";

const today = new Date().toISOString().slice(0, 10);
const start = new Date();
start.setDate(1);
const firstDay = start.toISOString().slice(0, 10);

export default function AffiliateReports() {
  const [from, setFrom] = useState(firstDay), [to, setTo] = useState(today);
  const [overview, setOverview] = useState(null), [trends, setTrends] = useState([]);
  const [marketplaceReport, setMarketplaceReport] = useState([]);
  const [productReport, setProductReport] = useState(null);
  const [marketplaces, setMarketplaces] = useState([]), [categories, setCategories] = useState([]), [brands, setBrands] = useState([]);
  const [search, setSearch] = useState(""), [marketplaceId, setMarketplaceId] = useState("");
  const [categoryId, setCategoryId] = useState(""), [brandId, setBrandId] = useState(""), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true), [tableLoading, setTableLoading] = useState(true), [error, setError] = useState("");

  const baseParams = { ...(from ? { from } : {}), ...(to ? { to } : {}) };

  const loadSummary = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [o, t, m] = await Promise.all([
        getAffiliateOverview(baseParams), getAffiliateTrends(baseParams), getAffiliateMarketplaceReport(baseParams),
      ]);
      setOverview(o); setTrends(t?.trends ?? []); setMarketplaceReport(m?.marketplaces ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load affiliate reports.");
    } finally { setLoading(false); }
  }, [from, to]);

  const loadProducts = useCallback(async () => {
    setTableLoading(true);
    try {
      setProductReport(await getAffiliateProductReport({
        ...baseParams, page, limit: 10,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(marketplaceId ? { marketplaceId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load product report.");
    } finally { setTableLoading(false); }
  }, [from, to, page, search, marketplaceId, categoryId, brandId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    Promise.all([getAffiliateMarketplaces({ status: "ACTIVE" }), getCategoriesForAffiliate(), getBrandsForAffiliate()])
      .then(([m, c, b]) => { setMarketplaces(Array.isArray(m) ? m : []); setCategories(c); setBrands(b); })
      .catch(() => {});
  }, []);
  useEffect(() => { setPage(1); }, [search, marketplaceId, categoryId, brandId, from, to]);

  const products = productReport?.products ?? [], pagination = productReport?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h1 className="text-2xl font-semibold text-gray-900">Affiliate Reports</h1><p className="mt-1 text-sm text-gray-500">Monitor affiliate traffic and marketplace performance.</p></div>
        <button onClick={() => { loadSummary(); loadProducts(); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium shadow-sm hover:bg-gray-50"><RefreshCw size={16}/> Refresh</button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to || undefined} className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-orange-400"/></label>
          <label className="text-sm font-medium text-gray-700">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from || undefined} max={today} className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-orange-400"/></label>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <AffiliateStats data={overview} loading={loading}/>
      <AffiliateTrendChart trends={trends} loading={loading}/>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h2 className="font-semibold text-gray-900">Marketplace Performance</h2><p className="mt-1 text-sm text-gray-500">Click activity grouped by affiliate marketplace.</p></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Marketplace</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Products</th><th className="px-5 py-3">Clicks</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {marketplaceReport.map((x) => <tr key={x.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-medium">{x.name}</td><td className="px-5 py-4 font-mono text-xs text-gray-500">{x.code}</td><td className="px-5 py-4">{Number(x.productCount).toLocaleString("en-IN")}</td><td className="px-5 py-4 font-semibold">{Number(x.clickCount).toLocaleString("en-IN")}</td><td className="px-5 py-4"><AffiliateMarketplaceBadge status={x.status}/></td></tr>)}
            {!marketplaceReport.length && !loading && <tr><td colSpan="5" className="px-5 py-10 text-center text-gray-500">No marketplace activity found.</td></tr>}
          </tbody>
        </table></div>
      </div>

      <div className="space-y-4">
        <div><h2 className="font-semibold text-gray-900">Product Performance</h2><p className="mt-1 text-sm text-gray-500">Affiliate products ranked by clicks for the selected period.</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product..." className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-orange-400"/></div>
            <select value={marketplaceId} onChange={(e) => setMarketplaceId(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm"><option value="">All marketplaces</option>{marketplaces.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm"><option value="">All categories</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm"><option value="">All brands</option>{brands.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">Marketplace</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Brand</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Clicks</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {tableLoading ? <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-500">Loading products...</td></tr> :
                products.length ? products.map(x => <tr key={x.id} className="hover:bg-gray-50"><td className="px-5 py-4"><div className="font-medium">{x.name}</div><div className="text-xs text-gray-400">{x.slug}</div></td><td className="px-5 py-4">{x.marketplace?.name ?? "—"}</td><td className="px-5 py-4 text-gray-600">{x.category?.name ?? "—"}</td><td className="px-5 py-4 text-gray-600">{x.brand?.name ?? "—"}</td><td className="px-5 py-4">₹{x.displayPrice == null ? "—" : Number(x.displayPrice).toLocaleString("en-IN")}</td><td className="px-5 py-4 font-semibold">{Number(x.clickCount).toLocaleString("en-IN")}</td></tr>) :
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-500">No affiliate products found.</td></tr>}
            </tbody>
          </table></div>
          {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4"><p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"><ChevronLeft size={16}/> Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40">Next <ChevronRight size={16}/></button></div></div>}
        </div>
      </div>
    </div>
  );
}
