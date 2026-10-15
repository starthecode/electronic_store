import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { user, initialized } = useSelector((state) => state.auth);
  const location = useLocation();
  if (!initialized) return <div className="min-h-[60vh] flex items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
};
export default ProtectedRoute;
