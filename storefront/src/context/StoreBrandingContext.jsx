import { useEffect, useState } from "react";
import { getStoreBranding } from "../services/storeProduct.service";
import {
  defaultBranding,
  StoreBrandingContext,
} from "./storeBrandingContext";

export const StoreBrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding);

  useEffect(() => {
    let cancelled = false;
    getStoreBranding()
      .then((response) => {
        const data = response?.data;
        if (!data || typeof data.storeName !== "string") {
          throw new Error("Store branding response is invalid.");
        }
        if (!cancelled) {
          const storeName = data.storeName.trim() || defaultBranding.storeName;
          setBranding({
            logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
            storeName,
            logoAltText:
              typeof data.logoAltText === "string" && data.logoAltText.trim()
                ? data.logoAltText.trim()
                : storeName,
          });
        }
      })
      .catch((error) => {
        console.error("Unable to load storefront branding.", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StoreBrandingContext.Provider value={branding}>
      {children}
    </StoreBrandingContext.Provider>
  );
};
