import React from "react";
import {
  ChevronDown,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useStoreBranding } from "../../context/useStoreBranding";

const Header = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { logoUrl, storeName, logoAltText } = useStoreBranding();
  const [failedLogoUrl, setFailedLogoUrl] = React.useState("");
  const validLogoUrl = (() => {
    try {
      const url = new URL(logoUrl);
      return ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password;
    } catch {
      return false;
    }
  })();

  return (
    <header className="border-b border-transparent bg-white">
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 lg:px-8">
        <nav className="hidden items-center gap-6 text-[12px] lg:flex">
          <Link to="/" className="font-medium text-black">
            Home
          </Link>

          <Link
            to="/shop"
            className="flex items-center gap-1 text-gray-500 hover:text-black"
          >
            Shop
            <ChevronDown size={11} />
          </Link>

          <Link
            to="/shop"
            className="flex items-center gap-1 text-gray-500 hover:text-black"
          >
            Products
            <ChevronDown size={11} />
          </Link>

          <Link
            to="/shop"
            className="text-gray-500 hover:text-black"
          >
            Deals
          </Link>

          <a
            href="#footer"
            className="text-gray-500 hover:text-black"
          >
            About Us
          </a>
        </nav>

        <Link
          to="/"
          aria-label={`${storeName} home`}
          className="absolute left-1/2 flex max-w-[150px] -translate-x-1/2 items-center justify-center"
        >
          {validLogoUrl && failedLogoUrl !== logoUrl ? (
            <img
              src={logoUrl}
              alt={logoAltText || storeName}
              onError={() => setFailedLogoUrl(logoUrl)}
              className="max-h-10 max-w-full object-contain"
            />
          ) : (
            <span className="max-w-full truncate text-[15px] font-bold tracking-[-0.5px]">
              {storeName}
            </span>
          )}
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="hidden h-9 w-[150px] items-center justify-between rounded-full px-4 text-[11px] sm:flex ui-btn-outline"
          >
            <span>Search</span>
            <Search size={14} className="text-black" />
          </button>

          <Link
            to="/cart"
            className="relative flex h-8 w-8 items-center justify-center"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <ShoppingBag size={17} strokeWidth={1.6} />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-black px-1 text-[8px] font-medium text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => navigate("/account")}
            aria-label="Account"
           className="ui-btn-outline">
            <UserRound size={17} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
