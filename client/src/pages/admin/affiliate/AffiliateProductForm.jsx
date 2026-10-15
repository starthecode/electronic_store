import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createAffiliateProduct, getAffiliateProduct, updateAffiliateProduct, getAffiliateMarketplaces, getCategoriesForAffiliate, getBrandsForAffiliate } from "../../../services/affiliate.service";

const initial={name:"",slug:"",shortDescription:"",description:"",imageUrl:"",categoryId:"",brandId:"",marketplaceId:"",externalProductId:"",productUrl:"",affiliateUrl:"",displayPrice:"",status:"ACTIVE"};

export default function AffiliateProductForm(){
  const navigate=useNavigate(),{id}=useParams(),editing=Boolean(id);
  const [form,setForm]=useState(initial),[marketplaces,setMarketplaces]=useState([]),[categories,setCategories]=useState([]),[brands,setBrands]=useState([]);
  const [loading,setLoading]=useState(editing),[saving,setSaving]=useState(false),[error,setError]=useState("");

  useEffect(()=>{Promise.all([getAffiliateMarketplaces({status:"ACTIVE"}),getCategoriesForAffiliate(),getBrandsForAffiliate()]).then(([m,c,b])=>{setMarketplaces(Array.isArray(m)?m:[]);setCategories(c);setBrands(b)}).catch(err=>setError(err?.response?.data?.message||"Unable to load form options."))},[]);
  useEffect(()=>{if(!editing)return;getAffiliateProduct(id).then(x=>setForm({name:x.name??"",slug:x.slug??"",shortDescription:x.shortDescription??"",description:x.description??"",imageUrl:x.imageUrl??"",categoryId:x.categoryId??x.category?.id??"",brandId:x.brandId??x.brand?.id??"",marketplaceId:x.marketplaceId??x.marketplace?.id??"",externalProductId:x.externalProductId??"",productUrl:x.productUrl??"",affiliateUrl:x.affiliateUrl??"",displayPrice:x.displayPrice==null?"":String(x.displayPrice),status:x.status??"ACTIVE"})).catch(err=>setError(err?.response?.data?.message||"Unable to load affiliate product.")).finally(()=>setLoading(false))},[editing,id]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async e=>{e.preventDefault();setError("");if(!form.name.trim()||!form.slug.trim()||!form.marketplaceId||!form.affiliateUrl.trim())return setError("Name, slug, marketplace and affiliate URL are required.");setSaving(true);
    try{const payload={name:form.name.trim(),slug:form.slug.trim().toLowerCase(),marketplaceId:form.marketplaceId,affiliateUrl:form.affiliateUrl.trim(),status:form.status,...(form.shortDescription.trim()?{shortDescription:form.shortDescription.trim()}:{}),...(form.description.trim()?{description:form.description.trim()}:{}),...(form.imageUrl.trim()?{imageUrl:form.imageUrl.trim()}:{}),...(form.categoryId?{categoryId:form.categoryId}:{}),...(form.brandId?{brandId:form.brandId}:{}),...(form.externalProductId.trim()?{externalProductId:form.externalProductId.trim()}:{}),...(form.productUrl.trim()?{productUrl:form.productUrl.trim()}:{}),...(form.displayPrice!==""?{displayPrice:Number(form.displayPrice)}:{})};if(editing)await updateAffiliateProduct(id,payload);else await createAffiliateProduct(payload);navigate("/admin/affiliate/products")}catch(err){setError(err?.response?.data?.message||"Unable to save affiliate product.")}finally{setSaving(false)}};
  if(loading)return <div className="rounded-2xl border bg-white p-8 text-gray-500">Loading...</div>;
  const input=(key,label,type="text",placeholder="")=><label className="text-sm font-medium text-gray-700">{label}<input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-orange-400"/></label>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <button onClick={()=>navigate("/admin/affiliate/products")} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600"><ArrowLeft size={16}/> Back to Affiliate Products</button>
    <div><h1 className="text-2xl font-semibold text-gray-900">{editing?"Edit Affiliate Product":"Add Affiliate Product"}</h1><p className="mt-1 text-sm text-gray-500">Configure product information and its external affiliate destination.</p></div>
    <form onSubmit={submit} className="space-y-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {error&&<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section><h2 className="text-sm font-semibold">Basic Information</h2><div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
        {input("name","Product Name *","text","Product name")}{input("slug","Slug *","text","product-name")}
        <label className="text-sm font-medium text-gray-700">Marketplace *<select value={form.marketplaceId} onChange={e=>set("marketplaceId",e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="">Select marketplace</option>{marketplaces.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        {input("externalProductId","External Product ID")}{input("displayPrice","Display Price","number","49999")}
        <label className="text-sm font-medium text-gray-700">Category<select value={form.categoryId} onChange={e=>set("categoryId",e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="">No category</option>{categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="text-sm font-medium text-gray-700">Brand<select value={form.brandId} onChange={e=>set("brandId",e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="">No brand</option>{brands.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="text-sm font-medium text-gray-700">Status<select value={form.status} onChange={e=>set("status",e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      </div></section>
      <section className="border-t pt-6"><h2 className="text-sm font-semibold">Links & Media</h2><div className="mt-4 space-y-5">{input("affiliateUrl","Affiliate URL *","url","https://...")}{input("productUrl","Product URL","url","https://...")}{input("imageUrl","Image URL","url","https://...")}<p className="text-xs text-gray-400">The Affiliate URL is used by the tracked redirect endpoint.</p></div></section>
      <section className="border-t pt-6"><h2 className="text-sm font-semibold">Description</h2><div className="mt-4 space-y-5"><label className="block text-sm font-medium">Short Description<textarea rows="3" value={form.shortDescription} onChange={e=>set("shortDescription",e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 outline-none focus:border-orange-400"/></label><label className="block text-sm font-medium">Description<textarea rows="6" value={form.description} onChange={e=>set("description",e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 outline-none focus:border-orange-400"/></label></div></section>
      <div className="flex justify-end gap-3 border-t pt-5"><button type="button" onClick={()=>navigate("/admin/affiliate/products")} className="h-10 rounded-xl border px-4 text-sm">Cancel</button><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white disabled:opacity-50"><Save size={16}/>{saving?"Saving...":"Save Affiliate Product"}</button></div>
    </form>
  </div>;
}
