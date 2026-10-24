import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, RefreshCw } from "lucide-react";
import { getAffiliateMarketplaces, deleteAffiliateMarketplace, updateAffiliateMarketplace } from "../../../services/affiliate.service";
import AffiliateMarketplaceBadge from "../../../components/affiliate/AffiliateMarketplaceBadge";

export default function AffiliateMarketplaces() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true), [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await getAffiliateMarketplaces({ ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { status } : {}) });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) { setError(err?.response?.data?.message || "Unable to load marketplaces."); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const remove = async (item) => {
    if (!window.confirm(`Delete marketplace "${item.name}"?`)) return;
    try { await deleteAffiliateMarketplace(item.id); await load(); }
    catch (err) { setError(err?.response?.data?.message || "Unable to delete marketplace."); }
  };

  const toggle = async (item) => {
    try { await updateAffiliateMarketplace(item.id, { status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }); await load(); }
    catch (err) { setError(err?.response?.data?.message || "Unable to update marketplace."); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div><h1 className="text-2xl font-semibold text-gray-900">Affiliate Marketplaces</h1><p className="mt-1 text-sm text-gray-500">Manage external marketplaces used by affiliate products.</p></div>
      <Link to="/admin/affiliate/marketplaces/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium ui-btn-primary"><Plus size={17}/> Add Marketplace</Link>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marketplace..." className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-orange-400"/></div>
      <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
      <button onClick={load} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium ui-btn-outline"><RefreshCw size={16}/> Refresh</button>
    </div></div>
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Marketplace</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Products</th><th className="px-5 py-3">Base URL</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
      <tbody className="divide-y divide-gray-100">
        {loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">Loading marketplaces...</td></tr> :
        items.length ? items.map(x => <tr key={x.id} className="hover:bg-gray-50">
          <td className="px-5 py-4"><div className="flex items-center gap-3">{x.logoUrl ? <img src={x.logoUrl} alt="" className="h-9 w-9 rounded-lg border object-contain"/> : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold">{x.name?.slice(0,2).toUpperCase()}</div>}<span className="font-medium">{x.name}</span></div></td>
          <td className="px-5 py-4 font-mono text-xs text-gray-600">{x.code}</td><td className="px-5 py-4">{Number(x._count?.products ?? 0).toLocaleString("en-IN")}</td><td className="max-w-[220px] truncate px-5 py-4 text-gray-500">{x.baseUrl || "—"}</td>
          <td className="px-5 py-4"><button onClick={() => toggle(x)} className="ui-btn-outline"><AffiliateMarketplaceBadge status={x.status}/></button></td>
          <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => navigate(`/admin/affiliate/marketplaces/${x.id}/edit`)} className="rounded-lg p-2 ui-btn-outline"><Pencil size={16}/></button><button onClick={() => remove(x)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 ui-btn-danger"><Trash2 size={16}/></button></div></td>
        </tr>) : <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">No affiliate marketplaces found.</td></tr>}
      </tbody>
    </table></div></div>
  </div>;
}
