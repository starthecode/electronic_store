import { createContext } from "react";

export const defaultBranding = {
  logoUrl: "",
  storeName: "Store",
  logoAltText: "Store",
};

export const StoreBrandingContext = createContext(defaultBranding);
