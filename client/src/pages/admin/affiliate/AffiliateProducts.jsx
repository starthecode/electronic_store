import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getAffiliateProducts, getAffiliateMarketplaces, deleteAffiliateProduct, updateAffiliateProductStatus, getCategoriesForAffiliate, getBrandsForAffiliate } from "../../../services/affiliate.service";
import AffiliateProductStatusBadge from "../../../components/affiliate/AffiliateProductStatusBadge";

export default function AffiliateProducts() {
  const navigate=useNavigate();
  const [data,setData]=useState({products:[],pagination:null}),[marketplaces,setMarketplaces]=useState([]),[categories,setCategories]=useState([]),[brands,setBrands]=useState([]);
  const [search,setSearch]=useState(""),[marketplaceId,setMarketplaceId]=useState(""),[categoryId,setCategoryId]=useState(""),[brandId,setBrandId]=useState(""),[status,setStatus]=useState(""),[page,setPage]=useState(1);
  const [loading,setLoading]=useState(true),[error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{setData(await getAffiliateProducts({page,limit:12,...(search.trim()?{search:search.trim()}:{}),...(marketplaceId?{marketplaceId}:{}),...(categoryId?{categoryId}:{}),...(brandId?{brandId}:{}),...(status?{status}:{}),sortBy:"createdAt",sortOrder:"desc"}))}
    catch(err){setError(err?.response?.data?.message||"Unable to load affiliate products.");}
    finally{setLoading(false);}
  },[page,search,marketplaceId,categoryId,brandId,status]);

  useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  useEffect(()=>{Promise.all([getAffiliateMarketplaces({status:"ACTIVE"}),getCategoriesForAffiliate(),getBrandsForAffiliate()]).then(([m,c,b])=>{setMarketplaces(Array.isArray(m)?m:[]);setCategories(c);setBrands(b)}).catch(()=>{})},[]);
  useEffect(()=>{setPage(1)},[search,marketplaceId,categoryId,brandId,status]);

  const remove=async x=>{if(!window.confirm(`Delete affiliate product "${x.name}"?`))return;try{await deleteAffiliateProduct(x.id);await load()}catch(err){setError(err?.response?.data?.message||"Unable to delete affiliate product.")}};
  const toggle=async x=>{try{await updateAffiliateProductStatus(x.id,x.status==="ACTIVE"?"INACTIVE":"ACTIVE");await load()}catch(err){setError(err?.response?.data?.message||"Unable to update product status.")}};

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h1 className="text-2xl font-semibold text-gray-900">Affiliate Products</h1><p className="mt-1 text-sm text-gray-500">Manage products promoted through external marketplaces.</p></div><Link to="/admin/affiliate/products/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white"><Plus size={17}/> Add Affiliate Product</Link></div>
    {error&&<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="relative xl:col-span-2"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, slug or external ID..." className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-orange-400"/></div>
      <select value={marketplaceId} onChange={e=>setMarketplaceId(e.target.value)} className="h-10 rounded-xl border px-3 text-sm"><option value="">All marketplaces</option>{marketplaces.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="h-10 rounded-xl border px-3 text-sm"><option value="">All categories</option>{categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select value={brandId} onChange={e=>setBrandId(e.target.value)} className="h-10 rounded-xl border px-3 text-sm"><option value="">All brands</option>{brands.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select value={status} onChange={e=>setStatus(e.target.value)} className="h-10 rounded-xl border px-3 text-sm"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
      <button onClick={load} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm"><RefreshCw size={16}/> Refresh</button>
    </div></div>
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">Marketplace</th><th className="px-5 py-3">Category / Brand</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
      <tbody className="divide-y divide-gray-100">{loading?<tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">Loading affiliate products...</td></tr>:data.products?.length?data.products.map(x=><tr key={x.id} className="hover:bg-gray-50">
        <td className="px-5 py-4"><div className="flex items-center gap-3">{x.imageUrl?<img src={x.imageUrl} alt="" className="h-12 w-12 rounded-xl border object-contain"/>:<div className="h-12 w-12 rounded-xl bg-gray-100"/>}<div className="min-w-0"><div className="truncate font-medium">{x.name}</div><div className="truncate text-xs text-gray-400">{x.externalProductId||x.slug}</div></div></div></td>
        <td className="px-5 py-4"><div className="font-medium">{x.marketplace?.name??"—"}</div><div className="text-xs text-gray-400">{x.marketplace?.code??""}</div></td>
        <td className="px-5 py-4"><div>{x.category?.name??"—"}</div><div className="text-xs text-gray-400">{x.brand?.name??"—"}</div></td>
        <td className="px-5 py-4">₹{x.displayPrice==null?"—":Number(x.displayPrice).toLocaleString("en-IN")}</td><td className="px-5 py-4"><button onClick={()=>toggle(x)}><AffiliateProductStatusBadge status={x.status}/></button></td>
        <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={()=>navigate(`/admin/affiliate/products/${x.id}/edit`)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><Pencil size={16}/></button><button onClick={()=>remove(x)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div></td>
      </tr>):<tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">No affiliate products found.</td></tr>}</tbody>
    </table></div>
    {data.pagination&&data.pagination.totalPages>1&&<div className="flex items-center justify-between border-t px-5 py-4"><p className="text-sm text-gray-500">{data.pagination.total.toLocaleString("en-IN")} products · Page {data.pagination.page} of {data.pagination.totalPages}</p><div className="flex gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"><ChevronLeft size={16}/> Previous</button><button disabled={page>=data.pagination.totalPages} onClick={()=>setPage(p=>p+1)} className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40">Next <ChevronRight size={16}/></button></div></div>}
    </div>
  </div>;
}
