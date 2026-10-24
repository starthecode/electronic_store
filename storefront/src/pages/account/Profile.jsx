import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getProfile, updateProfile } from "../../services/customer.service";
import { setAuthUser } from "../../store/slices/authSlice";

const Profile = () => {
  const dispatch = useDispatch(); const [form, setForm] = useState(null); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { getProfile().then(setForm).catch(e => setError(e.message)); }, []);
  const save = async (e) => { e.preventDefault(); setSaving(true); setError(""); try { const user = await updateProfile(form); setForm(user); dispatch(setAuthUser(user)); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  if (!form) return <main className="min-h-[60vh] p-12 text-center text-sm text-gray-500">Loading profile…</main>;
  return <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-12"><div className="mx-auto max-w-xl"><Link to="/account" className="text-sm text-gray-500 hover:text-black">← My account</Link><h1 className="mt-5 text-3xl font-semibold">Profile</h1>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6"><label className="block text-sm">First name<input required value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3" /></label><label className="block text-sm">Last name<input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3" /></label><label className="block text-sm">Email<input disabled value={form.email || ""} className="mt-2 h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 text-gray-500" /></label><label className="block text-sm">Phone<input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3" /></label><button disabled={saving} className="rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-60 ui-btn-primary">{saving ? "Saving…" : "Save changes"}</button></form></div></main>;
};
export default Profile;
