import { LogOut, Package, UserRound, MapPin, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

const Account = () => {
  const dispatch = useDispatch(); const { user, loading } = useSelector(s => s.auth);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Customer";
  const cards = [
    ["/account/orders", Package, "My orders", "View your purchases and order status."],
    ["/account/profile", UserRound, "Profile", "Manage your personal information."],
    ["/account/addresses", MapPin, "Addresses", "Save and manage delivery addresses."]
  ];
  return <main className="min-h-[calc(100vh-76px)] bg-[#f7f7f7] px-5 py-12"><div className="mx-auto max-w-5xl"><div className="mb-9"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">My account</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hello, {name}</h1><p className="mt-2 text-sm text-gray-500">{user?.email}</p></div><div className="grid gap-5 md:grid-cols-3">{cards.map(([to, Icon, title, desc]) => <Link key={to} to={to} className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-black"><Icon size={21} strokeWidth={1.7} /><h2 className="mt-7 text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{desc}</p><ChevronRight className="mt-5 text-gray-300 transition group-hover:translate-x-1 group-hover:text-black" size={18} /></Link>)}</div><div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6"><button disabled={loading} onClick={() => dispatch(logout())} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black disabled:opacity-50"><LogOut size={17} />Sign out</button></div></div></main>;
}; export default Account;
