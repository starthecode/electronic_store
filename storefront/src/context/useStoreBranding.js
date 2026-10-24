import { useContext } from "react";
import { StoreBrandingContext } from "./storeBrandingContext";

export const useStoreBranding = () => useContext(StoreBrandingContext);
