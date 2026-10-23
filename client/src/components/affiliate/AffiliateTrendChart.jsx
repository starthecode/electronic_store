import { useMemo } from "react";

export default function AffiliateTrendChart({ trends = [], loading }) {
  const chart = useMemo(() => {
    if (!trends.length) return null;
    const width = 900, height = 280, padX = 42, padY = 30;
    const max = Math.max(
      ...trends.flatMap((item) => [
        Number(item.clicks || 0),
        Number(item.uniqueVisitors || 0),
      ]),
      1
    );
    const points = trends.map((item, i) => ({
      ...item,
      x: padX + (i / Math.max(trends.length - 1, 1)) * (width - padX * 2),
      clicksY: height - padY - (Number(item.clicks || 0) / max) * (height - padY * 2),
      visitorsY: height - padY - (Number(item.uniqueVisitors || 0) / max) * (height - padY * 2),
    }));
    return { width, height, padX, padY, points };
  }, [trends]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">Daily traffic trend</h3>
      <p className="mt-1 text-sm text-gray-500">Outbound clicks and consented unique visitors, grouped by Asia/Kolkata day.</p>
      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-xl bg-gray-100" />
      ) : !chart ? (
        <div className="mt-5 flex h-64 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
          No click data for this period.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-64 min-w-[700px] w-full">
            {[0, .25, .5, .75, 1].map((ratio) => {
              const y = chart.height - chart.padY - ratio * (chart.height - chart.padY * 2);
              return <line key={ratio} x1={chart.padX} x2={chart.width - chart.padX} y1={y} y2={y} stroke="currentColor" className="text-gray-100" />;
            })}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-orange-500"
              points={chart.points.map((p) => `${p.x},${p.clicksY}`).join(" ")}
            />
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 5"
              className="text-blue-500"
              points={chart.points.map((p) => `${p.x},${p.visitorsY}`).join(" ")}
            />
            {chart.points.map((p) => <circle key={p.date} cx={p.x} cy={p.clicksY} r="4" className="fill-orange-500" />)}
            {chart.points.map((p) => <circle key={`${p.date}-visitors`} cx={p.x} cy={p.visitorsY} r="3" className="fill-blue-500" />)}
            <text x={chart.padX} y={chart.height - 7} className="fill-gray-400 text-[11px]">{chart.points[0].date}</text>
            <text x={chart.width - chart.padX} y={chart.height - 7} textAnchor="end" className="fill-gray-400 text-[11px]">{chart.points.at(-1).date}</text>
          </svg>
          <div className="mt-2 flex gap-5 text-xs text-gray-500">
            <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-500" />Outbound clicks</span>
            <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />Unique visitors</span>
          </div>
        </div>
      )}
    </div>
  );
}
