import crypto from "node:crypto";

export interface AffiliateTrackingInput {
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  landingPath?: string;
}

export interface AffiliateLocation {
  countryCode: string | null;
  region: string | null;
  city: string | null;
}

export const emptyAffiliateLocation = (): AffiliateLocation => ({
  countryCode: null,
  region: null,
  city: null,
});

const cleanText = (
  value: unknown,
  maxLength: number
): string | null => {
  if (typeof value !== "string") return null;

  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);

  return normalized || null;
};

export const normalizeHostname = (
  value: unknown
): string | null => {
  const hostname =
    typeof value === "string" ? value.trim().toLowerCase() : null;
  if (
    !hostname ||
    hostname.length > 253 ||
    /[\u0000-\u0020\u007f/:?#@]/.test(hostname)
  ) {
    return null;
  }

  try {
    const parsed = new URL(`https://${hostname}`);
    return parsed.hostname === hostname ? hostname : null;
  } catch {
    return null;
  }
};

export const normalizeLandingPath = (
  value: unknown
): string | null => {
  const path = cleanText(value, 500);
  if (!path?.startsWith("/") || path.startsWith("//")) return null;

  try {
    const parsed = new URL(path, "https://magdeal.invalid");
    if (parsed.origin !== "https://magdeal.invalid") return null;
    return parsed.pathname.slice(0, 500) || "/";
  } catch {
    return null;
  }
};

export const normalizeAffiliateTracking = (
  input: AffiliateTrackingInput
) => ({
  referrerHost: normalizeHostname(input.referrerHost),
  utmSource: cleanText(input.utmSource, 200),
  utmMedium: cleanText(input.utmMedium, 200),
  utmCampaign: cleanText(input.utmCampaign, 200),
  utmContent: cleanText(input.utmContent, 200),
  landingPath: normalizeLandingPath(input.landingPath),
});

export const createVisitorCookieValue = (value?: unknown) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value)
    ? value
    : crypto.randomBytes(32).toString("base64url");

export const hashVisitorCookie = (
  value: string,
  secret: string
) =>
  crypto
    .createHmac("sha256", secret)
    .update(`magdeal-affiliate-visitor:${value}`)
    .digest("hex");

export const makeAffiliateClickData = ({
  product,
  visitorHash,
  location,
  tracking,
}: {
  product: { id: string; marketplaceId: string };
  visitorHash: string | null;
  location: AffiliateLocation;
  tracking: ReturnType<typeof normalizeAffiliateTracking>;
}) => ({
  affiliateProductId: product.id,
  marketplaceId: product.marketplaceId,
  visitorHash,
  countryCode: location.countryCode,
  region: location.region,
  city: location.city,
  ...tracking,
});

export const getKolkataDateRange = (
  from?: string,
  to?: string
) => {
  const toBoundary = (date: string, nextDay = false) => {
    const [year, month, day] = date.split("-").map(Number);
    const utcMidnight = Date.UTC(year, month - 1, day + (nextDay ? 1 : 0));
    const kolkataOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(utcMidnight - kolkataOffsetMs);
  };

  return {
    start: from ? toBoundary(from) : undefined,
    endExclusive: to ? toBoundary(to, true) : undefined,
  };
};

export const displayReferralSource = (host: string | null) =>
  host ?? "Direct / Unknown";
