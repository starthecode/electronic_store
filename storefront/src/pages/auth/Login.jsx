import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, login } from "../../store/slices/authSlice";

const Login = () => {
  const dispatch = useDispatch(), navigate = useNavigate(), location = useLocation();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  useEffect(() => { if (user) navigate(location.state?.from || "/account", { replace: true }); }, [user, navigate, location.state]);
  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);
  const update = (key) => (e) => { dispatch(clearAuthError()); setForm((x) => ({ ...x, [key]: e.target.value })); };
  const submit = async (e) => { e.preventDefault(); const result = await dispatch(login(form)); if (login.fulfilled.match(result)) navigate(location.state?.from || "/account", { replace: true }); };
  return <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-14"><div className="mx-auto max-w-md">
    <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black"><ArrowLeft size={14} />Back to store</Link>
    <section className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-8"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">Gearadge</p><h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm leading-6 text-gray-500">Sign in to manage your account, addresses and orders.</p></div>
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block"><span className="mb-2 block text-xs font-medium text-gray-700">Email</span><input required type="email" autoComplete="email" value={form.email} onChange={update("email")} className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-black" placeholder="you@example.com" /></label>
        <label className="block"><span className="mb-2 block text-xs font-medium text-gray-700">Password</span><div className="relative"><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={update("password")} className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-12 text-sm outline-none focus:border-black" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((x) => !x)} className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-gray-400 hover:text-black" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">{loading && <Loader2 size={16} className="animate-spin" />}{loading ? "Signing in..." : "Sign in"}</button>
      </form><p className="mt-7 text-center text-sm text-gray-500">Don't have an account? <Link to="/register" className="font-medium text-black hover:underline">Create one</Link></p>
    </section></div></main>;
};
export default Login;
