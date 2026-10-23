import fs from "node:fs";
import { isIP } from "node:net";
import maxmind, { type CityResponse, type Reader } from "maxmind";
import {
  emptyAffiliateLocation,
  type AffiliateLocation,
} from "./affiliateTracking.js";

let readerPromise: Promise<Reader<CityResponse>> | null = null;
let warnedUnavailable = false;

const warnUnavailable = (reason: string) => {
  if (warnedUnavailable) return;
  warnedUnavailable = true;
  console.warn(`Affiliate GeoLite2 lookup unavailable: ${reason}`);
};

const getReader = async () => {
  const databasePath = process.env.GEOLITE2_CITY_DB_PATH;
  if (!databasePath) {
    warnUnavailable("GEOLITE2_CITY_DB_PATH is not configured");
    return null;
  }

  if (!fs.existsSync(databasePath)) {
    warnUnavailable("configured city database file does not exist");
    return null;
  }

  readerPromise ??= maxmind.open<CityResponse>(databasePath, {
    watchForUpdates: true,
    watchForUpdatesNonPersistent: true,
  });

  try {
    return await readerPromise;
  } catch (error) {
    readerPromise = null;
    warnUnavailable(
      error instanceof Error ? error.message : "database could not be opened"
    );
    return null;
  }
};

export const lookupAffiliateLocation = async (
  ip: string | undefined
): Promise<AffiliateLocation> => {
  if (!ip || !isIP(ip)) return emptyAffiliateLocation();

  const reader = await getReader();
  if (!reader) return emptyAffiliateLocation();

  try {
    const result = reader.get(ip);
    return {
      countryCode: result?.country?.iso_code?.slice(0, 2) ?? null,
      region:
        result?.subdivisions?.[0]?.names?.en?.slice(0, 100) ?? null,
      city: result?.city?.names?.en?.slice(0, 100) ?? null,
    };
  } catch (error) {
    console.error(
      "Affiliate GeoLite2 lookup failed",
      error instanceof Error ? error.message : "unknown error"
    );
    return emptyAffiliateLocation();
  }
};
