import React from "react";

const pct = (value) => `${Math.round(value * 100)}%`;

export default function SegmentsPage({ t, rows, onSelectOrder }) {
  const factors = [
    {
      title: t.supplierDelaySegments,
      bands: [
        { label: t.supplierLowBand, matches: (order) => order.supplier_delay_rate <= 0.2 },
        { label: t.supplierMediumBand, matches: (order) => order.supplier_delay_rate > 0.2 && order.supplier_delay_rate <= 0.35 },
        { label: t.supplierHighBand, matches: (order) => order.supplier_delay_rate > 0.35 },
      ],
    },
    {
      title: t.workloadSegments,
      bands: [
        { label: t.workloadLowBand, matches: (order) => order.workload < 0.5 },
        { label: t.workloadMediumBand, matches: (order) => order.workload >= 0.5 && order.workload < 0.75 },
        { label: t.workloadHighBand, matches: (order) => order.workload >= 0.75 },
      ],
    },
    {
      title: t.distanceSegments,
      bands: [
        { label: t.distanceLowBand, matches: (order) => order.distance_km < 300 },
        { label: t.distanceMediumBand, matches: (order) => order.distance_km >= 300 && order.distance_km < 900 },
        { label: t.distanceHighBand, matches: (order) => order.distance_km >= 900 },
      ],
    },
  ];
  const high = rows.filter((order) => order.level === "Yüksek").length;
  const averageRisk = rows.length
    ? rows.reduce((total, order) => total + order.risk, 0) / rows.length
    : 0;

  return <>
    <section className="cards segment-cards">
      <article><small>{t.reviewed}</small><strong>{rows.length}</strong><span>{t.reviewedHint}</span></article>
      <article><small>{t.highRisk}</small><strong className="orange">{high}</strong><span>{t.highHint}</span></article>
      <article><small>{t.averageRisk}</small><strong>{pct(averageRisk)}</strong><span>{t.averageHint}</span></article>
    </section>
    <div className="segments-grid">
      {factors.map((factor) => {
        const segments = factor.bands.map((band) => {
          const orders = rows.filter(band.matches);
          return {
            ...band,
            orders,
            high: orders.filter((order) => order.level === "Yüksek").length,
            averageRisk: orders.length
              ? orders.reduce((total, order) => total + order.risk, 0) / orders.length
              : 0,
            priority: orders.reduce(
              (highest, order) => !highest || order.risk > highest.risk ? order : highest,
              null,
            ),
          };
        }).filter((segment) => segment.orders.length);

        return <section className="panel segment-panel" key={factor.title}>
          <div className="panel-head">
            <div><h2>{factor.title}</h2><p>{t.segmentPanelHint}</p></div>
          </div>
          {segments.length ? <div className="segment-list">
            {segments.map((segment) => <article className="segment-item" key={segment.label}>
              <div className="segment-heading">
                <strong>{segment.label}</strong>
                <span>{segment.orders.length} {t.orderCount}</span>
              </div>
              <div className="segment-stat"><span>{t.highRisk}</span><b>{segment.high}</b></div>
              <div className="segment-average">
                <span>{t.averageRisk}</span>
                <strong>{pct(segment.averageRisk)}</strong>
                <span className="segment-track" aria-hidden="true">
                  <span style={{ width: pct(segment.averageRisk) }} />
                </span>
              </div>
              {segment.priority && <button className="segment-priority" onClick={() => onSelectOrder(segment.priority)}>
                {t.inspectHighestRisk}: {segment.priority.order_id} · {pct(segment.priority.risk)}
              </button>}
            </article>)}
          </div> : <p className="empty">{t.noSegmentOrders}</p>}
        </section>;
      })}
    </div>
    <p className="disclaimer">{t.segmentDisclaimer}</p>
  </>;
}
