import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createAffiliateMarketplace, getAffiliateMarketplace, updateAffiliateMarketplace } from "../../../services/affiliate.service";

export default function AffiliateMarketplaceForm() {
  const navigate = useNavigate(), { id } = useParams(), editing = Boolean(id);
  const [form, setForm] = useState({ name:"", code:"", logoUrl:"", baseUrl:"", status:"ACTIVE" });
  const [loading, setLoading] = useState(editing), [saving, setSaving] = useState(false), [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    getAffiliateMarketplace(id).then(x => setForm({ name:x.name??"", code:x.code??"", logoUrl:x.logoUrl??"", baseUrl:x.baseUrl??"", status:x.status??"ACTIVE" }))
      .catch(err => setError(err?.response?.data?.message || "Unable to load marketplace.")).finally(() => setLoading(false));
  }, [editing,id]);

  const set = (key,value) => setForm(f => ({...f,[key]:value}));

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.name.trim() || !form.code.trim()) return setError("Name and code are required.");
    setSaving(true);
    try {
      const payload = { name:form.name.trim(), code:form.code.trim().toUpperCase(), status:form.status,
        ...(form.logoUrl.trim()?{logoUrl:form.logoUrl.trim()}:{}), ...(form.baseUrl.trim()?{baseUrl:form.baseUrl.trim()}:{}),
      };
      if (editing) await updateAffiliateMarketplace(id,payload); else await createAffiliateMarketplace(payload);
      navigate("/admin/affiliate/marketplaces");
    } catch(err) { setError(err?.response?.data?.message || "Unable to save marketplace."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="rounded-2xl border bg-white p-8 text-gray-500">Loading...</div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <button onClick={() => navigate("/admin/affiliate/marketplaces")} className="inline-flex items-center gap-2 text-sm font-medium ui-btn-outline"><ArrowLeft size={16}/> Back to Marketplaces</button>
    <div><h1 className="text-2xl font-semibold text-gray-900">{editing ? "Edit Marketplace" : "Add Marketplace"}</h1><p className="mt-1 text-sm text-gray-500">Configure an external affiliate marketplace.</p></div>
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[
          ["name","Name *","text","Amazon"],["code","Code *","text","AMAZON"],["logoUrl","Logo URL","url","https://..."],["baseUrl","Base URL","url","https://..."]
        ].map(([key,label,type,placeholder]) => <label key={key} className="text-sm font-medium text-gray-700">{label}<input type={type} value={form[key]} onChange={e => set(key,e.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-orange-400"/></label>)}
        <label className="text-sm font-medium text-gray-700">Status<select value={form.status} onChange={e => set("status",e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      </div>
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5"><button type="button" onClick={() => navigate("/admin/affiliate/marketplaces")} className="h-10 rounded-xl border px-4 text-sm ui-btn-outline">Cancel</button><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50 ui-btn-primary"><Save size={16}/>{saving ? "Saving..." : "Save Marketplace"}</button></div>
    </form>
  </div>;
}
