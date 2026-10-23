import { createContext, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { revokeAffiliateAnalyticsCookie } from "../services/storeProduct.service";

const CONSENT_KEY = "magdeal.analytics-consent.v1";
const ATTRIBUTION_KEY = "magdeal.affiliate-attribution.v1";

const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
};

const getEntryAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  const clean = (value) => {
    if (typeof value !== "string") return null;

    // Remove control characters before sending attribution metadata.
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200) || null;
  };
  let referrerHost = null;

  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (referrer && referrer.hostname !== window.location.hostname) {
      referrerHost = referrer.hostname.toLowerCase();
    }
  } catch {
    referrerHost = null;
  }

  return {
    referrerHost: clean(referrerHost)?.slice(0, 253) ?? null,
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmContent: clean(params.get("utm_content")),
    landingPath: window.location.pathname.slice(0, 500),
  };
};

const getInitialAnalyticsState = () => {
  const consent = readConsent();
  const current = getEntryAttribution();

  if (consent !== "accepted") {
    return { consent, attribution: current };
  }

  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
    const hasNewCampaign = Boolean(
      current.utmSource ||
        current.utmMedium ||
        current.utmCampaign ||
        current.utmContent
    );
    const shouldCapture =
      hasNewCampaign ||
      (current.referrerHost &&
        current.referrerHost !== window.location.hostname);

    if (!stored || shouldCapture) {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
      return { consent, attribution: current };
    }

    return { consent, attribution: JSON.parse(stored) };
  } catch {
    return { consent, attribution: current };
  }
};

const AffiliateAnalyticsContext = createContext(null);

export const AffiliateAnalyticsProvider = ({ children }) => {
  const [analytics, setAnalytics] = useState(getInitialAnalyticsState);
  const [consentError, setConsentError] = useState("");
  const { consent, attribution } = analytics;

  const accept = () => {
    const current = getEntryAttribution();
    setConsentError("");
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
    } catch {
      // Storage may be disabled; consent and attribution still apply in memory.
    }
    setAnalytics({ consent: "accepted", attribution: current });
  };

  const decline = () => {
    setConsentError("");
    try {
      localStorage.setItem(CONSENT_KEY, "declined");
      sessionStorage.removeItem(ATTRIBUTION_KEY);
    } catch {
      // Storage may be disabled; the current choice still applies in memory.
    }
    setAnalytics({ consent: "declined", attribution: null });
    revokeAffiliateAnalyticsCookie().catch(() => {
      setConsentError(
        "We could not clear the analytics cookie. Please retry or clear MagDeal cookies in your browser settings."
      );
    });
  };

  const resetConsent = () => {
    setConsentError("");
    try {
      localStorage.removeItem(CONSENT_KEY);
      sessionStorage.removeItem(ATTRIBUTION_KEY);
    } catch {
      // Storage may be disabled; the choice can still be updated in memory.
    }
    revokeAffiliateAnalyticsCookie().catch(() => {
      setConsentError(
        "We could not clear the analytics cookie. Please retry or clear MagDeal cookies in your browser settings."
      );
    });
    setAnalytics({ consent: null, attribution: getEntryAttribution() });
  };

  return (
    <AffiliateAnalyticsContext.Provider
      value={{
        consent,
        attribution,
        consentError,
        accept,
        decline,
        resetConsent,
      }}
    >
      {children}
      {consentError && (
        <p
          role="alert"
          className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-lg"
        >
          {consentError}
        </p>
      )}
      {consent !== "accepted" && consent !== "declined" && (
        <aside
          aria-label="Analytics consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] sm:p-6"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-gray-600">
              With your consent, MagDeal uses a 30-day pseudonymous browser
              identifier, approximate location, and referral/campaign details
              to measure affiliate traffic. We still count outbound clicks if
              you decline.{" "}
              <Link to="/privacy" className="font-medium text-gray-900 underline">
                Privacy details
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={decline}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={accept}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                Accept analytics
              </button>
            </div>
          </div>
        </aside>
      )}
    </AffiliateAnalyticsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAffiliateAnalytics = () => {
  const context = useContext(AffiliateAnalyticsContext);
  if (!context) {
    throw new Error(
      "useAffiliateAnalytics must be used within AffiliateAnalyticsProvider"
    );
  }
  return context;
};
