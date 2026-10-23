const Table = ({ title, headers, rows, emptyMessage }) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.key}>
              {row.values.map((value, index) => (
                <td key={`${row.key}-${index}`} className="px-5 py-4">
                  {value}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={headers.length} className="px-5 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const number = (value) => Number(value ?? 0).toLocaleString("en-IN");

export default function AffiliateAttributionTables({ data, loading }) {
  const locations = (data?.locations ?? []).map((item, index) => ({
    key: `${item.countryCode}-${item.region}-${item.city}-${index}`,
    values: [
      [item.city, item.region, item.countryCode].filter(Boolean).join(", ") ||
        "Unknown location",
      number(item.clickCount),
      number(item.uniqueVisitors),
    ],
  }));
  const sources = (data?.referralSources ?? []).map((item) => ({
    key: item.hostname,
    values: [item.hostname, number(item.clickCount), number(item.uniqueVisitors)],
  }));
  const campaigns = (data?.campaigns ?? []).map((item, index) => ({
    key: `${item.source}-${item.medium}-${item.campaign}-${index}`,
    values: [
      item.campaign,
      item.source || "—",
      item.medium || "—",
      number(item.clickCount),
      number(item.uniqueVisitors),
    ],
  }));
  const landingPages = (data?.landingPages ?? []).map((item) => ({
    key: item.path,
    values: [item.path, number(item.clickCount), number(item.uniqueVisitors)],
  }));

  if (loading) {
    return <p className="text-sm text-gray-500">Loading attribution reports...</p>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Table
        title="Geographic locations"
        headers={["Approximate location", "Outbound clicks", "Unique visitors"]}
        rows={locations}
        emptyMessage="No geographic data for this period."
      />
      <Table
        title="Referring hostnames"
        headers={["Source", "Outbound clicks", "Unique visitors"]}
        rows={sources}
        emptyMessage="No referral data for this period."
      />
      <div className="xl:col-span-2">
        <Table
          title="UTM campaign performance"
          headers={["Campaign", "Source", "Medium", "Outbound clicks", "Unique visitors"]}
          rows={campaigns}
          emptyMessage="No campaign data for this period."
        />
      </div>
      <div className="xl:col-span-2">
        <Table
          title="MagDeal landing pages"
          headers={["Landing page", "Outbound clicks", "Unique visitors"]}
          rows={landingPages}
          emptyMessage="No landing-page data for this period."
        />
      </div>
    </div>
  );
}
