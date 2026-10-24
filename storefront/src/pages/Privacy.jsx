import { useAffiliateAnalytics } from "../context/AffiliateAnalyticsContext";

const Privacy = () => (
  <PrivacyContent />
);

const PrivacyContent = () => {
  const { resetConsent, consentError } = useAffiliateAnalytics();

  return (
  <main className="mx-auto max-w-3xl px-5 py-12">
    <h1 className="text-3xl font-semibold">Privacy and affiliate analytics</h1>
    <div className="mt-6 space-y-4 text-sm leading-7 text-gray-600">
      <p>
        MagDeal records outbound affiliate product clicks, including the
        affiliate product and marketplace selected, to measure referrals.
        Click totals are recorded whether or not optional analytics are
        accepted.
      </p>
      <p>
        If you accept analytics, a random first-party browser identifier is
        kept in an HTTP-only, SameSite=Lax cookie (Secure on production HTTPS)
        for up to 30 days. Its keyed hash is
        attached to click records to estimate distinct browsers during the
        selected reporting period. It does not identify a person. Clearing or
        blocking cookies may cause the same browser to be counted again.
      </p>
      <p>
        With consent, MagDeal also records approximate country, region, and
        city from a locally installed GeoLite2 database, the referring hostname,
        campaign parameters, and the MagDeal landing path. The IP address is
        used transiently for the local lookup and is not saved in new click
        records or sent to a geolocation service. Location may be missing or
        inaccurate. Existing historic click data is not assigned invented
        locations.
      </p>
      <p>
        Analytics values are stored with click records. The current system does
        not automatically expire click records, so they remain subject to the
        database&apos;s configured retention and deletion process.
      </p>
      <p>
        Referring sources describe how a visitor arrived at MagDeal; the
        marketplace is the separate retailer destination they later clicked.
        Amazon sales, orders, shipped items, and commissions are not inferred
        from click tracking.
      </p>
      <p>
        You can decline analytics. Declining does not prevent affiliate
        redirects. Your choice can be changed here at any time.
      </p>
    </div>
    <button
      type="button"
      onClick={resetConsent}
      className="mt-6 rounded-full border px-4 py-2 text-sm font-medium ui-btn-outline"
    >
      Change analytics preference
    </button>
    {consentError && (
      <p role="alert" className="mt-4 text-sm text-red-700">
        {consentError}
      </p>
    )}
  </main>
  );
};

export default Privacy;
