import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  BrowserRouter,
} from "react-router-dom";

import AdminRoutes from "./routes/AdminRoutes";
import { initializeAuth } from "./store/slices/authSlice";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AdminRoutes />
    </BrowserRouter>
  );
};

export default App;