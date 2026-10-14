import React from "react";
import { signalKeys } from "../i18n.js";

const pct = (value) => `${Math.round(value * 100)}%`;

export default function OverviewPage({
  t, rows, shown, filter, setFilter, data, busy, language, selected,
  setSelected, explanation, setExplanation, run, api, upload, query,
  setQuery, dateFrom, setDateFrom, dateTo, setDateTo, sortBy, setSortBy,
}) {
  const levels = [
    { key: "high", value: "Yüksek", className: "high" },
    { key: "medium", value: "Orta", className: "medium" },
    { key: "low", value: "Düşük", className: "low" },
  ];
  const distribution = levels.map((level) => ({
    ...level,
    count: rows.filter((order) => order.level === level.value).length,
  }));
  const signalCounts = shown.flatMap((order) => order.signals).reduce((counts, signal) => {
    counts[signal] = (counts[signal] || 0) + 1;
    return counts;
  }, {});
  const signalStats = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]);
  const maxSignalCount = Math.max(1, ...signalStats.map(([, count]) => count));
  const high = rows.filter((order) => order.level === "Yüksek").length;
  const averageRisk = rows.length ? rows.reduce((total, order) => total + order.risk, 0) / rows.length : 0;

  function exportRows() {
    const columns = [
      "order_id", "order_date", "risk", "level", "quantity",
      "supplier_delay_rate", "workload", "distance_km", "promised_days", "signals",
    ];
    const csv = [columns, ...shown.map((order) => columns.map((column) =>
      column === "signals" ? order.signals.join(" | ") : order[column],
    ))]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `operasyon-radar-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <>
    <section className="cards">
      <article><small>{t.reviewed}</small><strong>{rows.length}</strong><span>{t.reviewedHint}</span></article>
      <article><small>{t.highRisk}</small><strong className="orange">{high}</strong><span>{t.highHint}</span></article>
      <article><small>{t.averageRisk}</small><strong>{pct(averageRisk)}</strong><span>{t.averageHint}</span></article>
      <article><small>{t.rocAuc}</small><strong>{data ? data.metrics.roc_auc.toFixed(2) : "—"}</strong><span>{t.rocHint}</span></article>
    </section>
    <section className="insights">
      <div className="panel distribution">
        <div className="panel-head">
          <div><h2>{t.riskDistribution}</h2><p>{t.distributionHint}</p></div>
          <span className="pill">{rows.length} {t.orderCount}</span>
        </div>
        <div className="distribution-list">
          {distribution.map((level) => (
            <button
              className={`distribution-item ${filter === level.key ? "active" : ""}`}
              key={level.key}
              onClick={() => setFilter(filter === level.key ? "all" : level.key)}
              aria-pressed={filter === level.key}
            >
              <span className={`distribution-mark ${level.className}`} />
              <span>{t[level.key]}</span>
              <strong>{level.count}</strong>
              <span className="distribution-track"><span className={level.className} style={{ width: `${rows.length ? (level.count / rows.length) * 100 : 0}%` }} /></span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel signal-summary">
        <div className="panel-head">
          <div><h2>{t.signalFrequency}</h2><p>{t.signalFrequencyHint}</p></div>
          <span className="pill">{shown.length} {t.matchingOrders}</span>
        </div>
        {signalStats.length ? <div className="signal-stats">
          {signalStats.map(([signal, count]) => (
            <div className="signal-stat" key={signal}>
              <span>{t[signalKeys[signal]] || signal}</span>
              <div className="signal-stat-track"><span style={{ width: `${(count / maxSignalCount) * 100}%` }} /></div>
              <strong>{count}</strong>
            </div>
          ))}
        </div> : <p className="empty">{t.noSignalMatches}</p>}
      </div>
    </section>
    <div className="grid">
      <section className="panel orders">
        <div className="panel-head">
          <div><h2>{t.orderRadar}</h2><p>{t.sortHint}</p></div>
          <span className="pill">{shown.length} {t.orderCount}</span>
        </div>
        <div className="filters">
          <input aria-label={t.search} placeholder={t.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label={t.riskFilter} value={filter} onChange={(event) => setFilter(event.target.value)}>
            {["all", "high", "medium", "low"].map((value) => <option key={value} value={value}>{t[value]}</option>)}
          </select>
          <label className="date-filter"><span>{t.dateFrom}</span><input aria-label={t.dateFrom} type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label className="date-filter"><span>{t.dateTo}</span><input aria-label={t.dateTo} type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
          <select aria-label={t.sortOrders} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="risk">{t.sortRisk}</option><option value="date-newest">{t.sortNewest}</option><option value="date-oldest">{t.sortOldest}</option><option value="order-id">{t.sortOrderId}</option>
          </select>
          <button className="export" disabled={!shown.length} onClick={exportRows}>{t.exportCsv}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t.order}</th><th>{t.distance}</th><th>{t.riskScore}</th><th>{t.level}</th><th /></tr></thead>
            <tbody>{shown.map((order) => (
              <tr key={order.order_id}>
                <td><b>{order.order_id}</b><small>{order.order_date}</small></td>
                <td>{order.distance_km} km</td>
                <td><div className="risk"><div className="track"><div style={{ width: pct(order.risk) }} /></div>{pct(order.risk)}</div></td>
                <td><span className={`badge ${order.level === "Yüksek" ? "high" : order.level === "Orta" ? "medium" : "low"}`}>{t[order.level === "Yüksek" ? "high" : order.level === "Orta" ? "medium" : "low"]}</span></td>
                <td><button disabled={busy} onClick={() => { setSelected(order); setExplanation(null); }}>{t.inspect}</button></td>
              </tr>
            ))}</tbody>
          </table>
          {!shown.length && <p className="empty">{t.notFound}</p>}
        </div>
      </section>
      <section className="panel detail">
        <small className="accent">{t.insight}</small>
        <h2>{selected?.order_id || t.discover}</h2>
        {selected ? <>
          <div className="big-risk">{pct(selected.risk)}<span>{t.modelRisk}</span></div>
          <h3>{t.operationalData}</h3>
          <dl className="facts">
            <div><dt>{t.quantity}</dt><dd>{selected.quantity} {t.units}</dd></div>
            <div><dt>{t.supplierDelayRate}</dt><dd>{pct(selected.supplier_delay_rate)}</dd></div>
            <div><dt>{t.workload}</dt><dd>{pct(selected.workload)}</dd></div>
            <div><dt>{t.distance}</dt><dd>{selected.distance_km} km</dd></div>
            <div><dt>{t.promisedDays}</dt><dd>{selected.promised_days} {t.days}</dd></div>
          </dl>
          <h3>{t.signals}</h3>
          <p className="muted">{t.signalDisclaimer}</p>
          {selected.signals.map((signal) => <div className="signal" key={signal}>{t[signalKeys[signal]] || signal}</div>)}
          <button className="primary" disabled={busy} onClick={() => run(async () => setExplanation(await api(`/explain/${encodeURIComponent(selected.order_id)}?lang=${language}`, { method: "POST" }, language)))}>{t.explain}</button>
          {explanation && <div className="explanation"><small>{explanation.source === "ollama" ? t.ollamaComment : t.noOllama}</small><p>{explanation.text}</p></div>}
        </> : <><div className="radar">◎</div><p>{t.chooseOrder}</p></>}
      </section>
    </div>
    <section className="panel training">
      <div>
        <h2>{t.dataToModel}</h2>
        <p>{t.trainingHint}</p>
        <div className="actions">
          <label className={busy ? "disabled" : ""}>{t.uploadTraining}<input disabled={busy} type="file" accept=".csv" onChange={(event) => upload(event, "/train")} /></label>
          <label className={busy ? "disabled" : ""}>{t.uploadOrders}<input disabled={busy} type="file" accept=".csv" onChange={(event) => upload(event, "/orders")} /></label>
          <a href="/api/template/training">{t.trainingExample}</a>
          <a href="/api/template/orders">{t.ordersExample}</a>
        </div>
      </div>
      {data && <div className="metrics">
        <span>{t.trainTest} <b>{data.metrics.train_rows} / {data.metrics.test_rows}</b></span>
        <span>{t.accuracy} <b>{pct(data.metrics.accuracy)} / {pct(data.metrics.baseline_accuracy)}</b></span>
        <span>{t.precisionRecall} <b>{pct(data.metrics.precision)} / {pct(data.metrics.recall)}</b></span>
        <span>{t.brier} <b>{data.metrics.brier.toFixed(3)}</b></span>
      </div>}
    </section>
  </>;
}