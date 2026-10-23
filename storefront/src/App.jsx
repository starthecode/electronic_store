import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Account from "./pages/account/Account";
import Profile from "./pages/account/Profile";
import Addresses from "./pages/account/Addresses";
import Orders from "./pages/account/Orders";
import OrderDetail from "./pages/account/OrderDetail";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import { CartProvider } from "./context/CartContext";
import Privacy from "./pages/Privacy";
import { AffiliateAnalyticsProvider } from "./context/AffiliateAnalyticsContext";

const App = () => {
  return (
    <BrowserRouter>
      <AffiliateAnalyticsProvider>
        <CartProvider>
          <Header />
          <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route path="/" element={<Home />} />

            <Route path="/shop" element={<Shop />} />

            <Route path="/products/:slug" element={<ProductDetails />} />

            <Route path="/cart" element={<Cart />} />

            <Route path="/checkout" element={<Checkout />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<Account />} />
              <Route path="/account/profile" element={<Profile />} />
              <Route path="/account/addresses" element={<Addresses />} />
              <Route path="/account/orders" element={<Orders />} />
              <Route path="/account/orders/:id" element={<OrderDetail />} />
            </Route>
          </Routes>

          <Footer />
        </CartProvider>
      </AffiliateAnalyticsProvider>
    </BrowserRouter>
  );
};

export default App;
