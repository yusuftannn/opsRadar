import React from "react";

const pct = (value) => `${Math.round(value * 100)}%`;

function getWeekStart(date) {
  const weekStart = new Date(`${date}T00:00:00Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  return weekStart.toISOString().slice(0, 10);
}

export default function TrendsPage({ t, rows }) {
  const weeks = Object.values(rows.reduce((groups, order) => {
    const start = getWeekStart(order.order_date);
    groups[start] ||= { start, count: 0, high: 0, riskTotal: 0 };
    groups[start].count += 1;
    groups[start].high += order.level === "Yüksek" ? 1 : 0;
    groups[start].riskTotal += order.risk;
    return groups;
  }, {})).map((week) => ({
    ...week,
    averageRisk: week.riskTotal / week.count,
  })).sort((a, b) => a.start.localeCompare(b.start));

  const high = rows.filter((order) => order.level === "Yüksek").length;
  const averageRisk = rows.length
    ? rows.reduce((total, order) => total + order.risk, 0) / rows.length
    : 0;
  const highestRiskWeek = weeks.reduce(
    (highest, week) => !highest || week.averageRisk > highest.averageRisk ? week : highest,
    null,
  );

  const chart = { width: 760, height: 260, left: 50, right: 18, top: 20, bottom: 48 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const points = weeks.map((week, index) => ({
    ...week,
    x: chart.left + (weeks.length === 1 ? plotWidth / 2 : (index / (weeks.length - 1)) * plotWidth),
    y: chart.top + (1 - week.averageRisk) * plotHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return <>
    <section className="cards">
      <article><small>{t.reviewed}</small><strong>{rows.length}</strong><span>{t.reviewedHint}</span></article>
      <article><small>{t.highRisk}</small><strong className="orange">{high}</strong><span>{t.highHint}</span></article>
      <article><small>{t.averageRisk}</small><strong>{pct(averageRisk)}</strong><span>{t.averageHint}</span></article>
      <article><small>{t.highestRiskWeek}</small><strong className="driver-value">{highestRiskWeek ? pct(highestRiskWeek.averageRisk) : "—"}</strong><span>{highestRiskWeek?.start || t.noTrendData}</span></article>
    </section>
    <section className="panel trend-panel">
      <div className="panel-head">
        <div><h2>{t.weeklyRisk}</h2><p>{t.weeklyRiskHint}</p></div>
        <span className="pill">{weeks.length} {t.weeksCount}</span>
      </div>
      {points.length ? <div className="trend-chart-wrap">
        <svg className="trend-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={t.riskTrendAria}>
          {[0, 0.5, 1].map((value) => {
            const y = chart.top + (1 - value) * plotHeight;
            return <g key={value}>
              <line className="trend-gridline" x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} />
              <text className="trend-axis-label" x={chart.left - 10} y={y + 4} textAnchor="end">{pct(value)}</text>
            </g>;
          })}
          {points.length > 1 && <polyline className="trend-line" points={line} />}
          {points.map((point) => <g key={point.start}>
            <circle className="trend-point" cx={point.x} cy={point.y} r="5">
              <title>{`${point.start}: ${pct(point.averageRisk)}`}</title>
            </circle>
            <text className="trend-axis-label" x={point.x} y={chart.height - 17} textAnchor="middle">{point.start.slice(5)}</text>
          </g>)}
        </svg>
      </div> : <p className="empty">{t.noTrendData}</p>}
    </section>
    <section className="panel trend-table-panel">
      <div className="panel-head"><div><h2>{t.weeklyBreakdown}</h2><p>{t.weeklyBreakdownHint}</p></div></div>
      {weeks.length ? <div className="table-wrap schedule-table-wrap">
        <table>
          <thead><tr><th>{t.weekStarting}</th><th>{t.orderCount}</th><th>{t.highRisk}</th><th>{t.averageRisk}</th></tr></thead>
          <tbody>{weeks.map((week) => <tr key={week.start}>
            <td><b>{week.start}</b></td><td>{week.count}</td><td><span className="badge high">{week.high}</span></td><td>{pct(week.averageRisk)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="empty">{t.noTrendData}</p>}
    </section>
  </>;
}
