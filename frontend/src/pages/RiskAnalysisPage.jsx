import React from "react";

const pct = (value) => `${Math.round(value * 100)}%`;

export default function RiskAnalysisPage({ t, rows, metrics, onSelectOrder }) {
  const high = rows.filter((order) => order.level === "Yüksek").length;
  const averageRisk = rows.length ? rows.reduce((total, order) => total + order.risk, 0) / rows.length : 0;
  const importance = Object.entries(metrics?.importance || {}).sort((a, b) => b[1] - a[1]);
  const maxImportance = Math.max(0.01, ...importance.map(([, value]) => value));
  const priorityOrders = rows.filter((order) => order.level === "Yüksek").slice(0, 8);
  const featureLabels = {
    quantity: t.quantityFeature,
    supplier_delay_rate: t.supplierDelayFeature,
    workload: t.workloadFeature,
    distance_km: t.distanceFeature,
    promised_days: t.promisedDaysFeature,
  };

  return <>
    <section className="cards">
      <article><small>{t.reviewed}</small><strong>{rows.length}</strong><span>{t.reviewedHint}</span></article>
      <article><small>{t.highRisk}</small><strong className="orange">{high}</strong><span>{t.highHint}</span></article>
      <article><small>{t.averageRisk}</small><strong>{pct(averageRisk)}</strong><span>{t.averageHint}</span></article>
      <article><small>{t.topDriver}</small><strong className="driver-value">{importance.length ? featureLabels[importance[0][0]] || importance[0][0] : "—"}</strong><span>{t.topDriverHint}</span></article>
    </section>
    <section className="analysis-grid">
      <div className="panel">
        <div className="panel-head"><div><h2>{t.modelDrivers}</h2><p>{t.modelDriversHint}</p></div></div>
        {importance.length ? <div className="importance-list">
          {importance.map(([feature, value]) => <div className="importance-row" key={feature}>
            <span>{featureLabels[feature] || feature}</span>
            <div className="importance-track"><span style={{ width: `${(value / maxImportance) * 100}%` }} /></div>
            <strong>{pct(value)}</strong>
          </div>)}
        </div> : <p className="empty">{t.noModelDrivers}</p>}
        <p className="disclaimer">{t.importanceDisclaimer}</p>
      </div>
      <div className="panel">
        <div className="panel-head"><div><h2>{t.priorityQueue}</h2><p>{t.priorityQueueHint}</p></div><span className="pill">{high} {t.orderCount}</span></div>
        {priorityOrders.length ? <div className="priority-list">
          {priorityOrders.map((order) => <button className="priority-item" key={order.order_id} onClick={() => onSelectOrder(order)}>
            <span><strong>{order.order_id}</strong><small>{order.order_date}</small></span><b>{pct(order.risk)}</b>
          </button>)}
        </div> : <p className="empty">{t.noHighRisk}</p>}
      </div>
    </section>
  </>;
}