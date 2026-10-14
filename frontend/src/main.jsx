import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { messages, signalKeys } from "./i18n.js";
const pct = (v) => `${Math.round(v * 100)}%`;
async function api(path, options, language) {
  const r = await fetch("/api" + path, options);
  const b = await r.json();
  if (!r.ok)
    throw new Error(
      typeof b.detail === "string" ? b.detail : messages[language].apiError,
    );
  return b;
}
function App() {
  const [language, setLanguage] = useState(() =>
      localStorage.getItem("operasyon-radar-language") === "en" ? "en" : "tr",
    ),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [dateFrom, setDateFrom] = useState(""),
    [dateTo, setDateTo] = useState(""),
    [sortBy, setSortBy] = useState("risk"),
    [selected, setSelected] = useState(null),
    [explanation, setExplanation] = useState(null);
  const t = messages[language];
  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setExplanation(null);
    setError("");
  }
  useEffect(() => {
    localStorage.setItem("operasyon-radar-language", language);
    document.documentElement.lang = language;
  }, [language]);
  async function refresh() {
    const d = await api("/dashboard", undefined, language);
    setData(d);
    setSelected(null);
    setExplanation(null);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function upload(event, path) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    run(async () => {
      const body = new FormData();
      body.append("file", file);
      await api(path, { method: "POST", body }, language);
      await refresh();
    });
  }
  const rows = data?.orders || [],
    filtered = rows.filter(
      (x) =>
        (filter === "all" || x.level === ({ high: "Yüksek", medium: "Orta", low: "Düşük" }[filter])) &&
        (!dateFrom || x.order_date >= dateFrom) &&
        (!dateTo || x.order_date <= dateTo) &&
        x.order_id.toLowerCase().includes(query.toLowerCase()),
    ),
    shown = [...filtered].sort((a, b) => {
      if (sortBy === "date-newest") return b.order_date.localeCompare(a.order_date);
      if (sortBy === "date-oldest") return a.order_date.localeCompare(b.order_date);
      if (sortBy === "order-id") return a.order_id.localeCompare(b.order_id);
      return b.risk - a.risk;
    });
  const levels = [
      { key: "high", value: "Yüksek", className: "high" },
      { key: "medium", value: "Orta", className: "medium" },
      { key: "low", value: "Düşük", className: "low" },
    ],
    distribution = levels.map((level) => ({
      ...level,
      count: rows.filter((order) => order.level === level.value).length,
    })),
    signalCounts = shown
      .flatMap((order) => order.signals)
      .reduce((counts, signal) => {
        counts[signal] = (counts[signal] || 0) + 1;
        return counts;
      }, {}),
    signalStats = Object.entries(signalCounts).sort((a, b) => b[1] - a[1]),
    maxSignalCount = Math.max(1, ...signalStats.map(([, count]) => count));
  const high = rows.filter((x) => x.level === "Yüksek").length,
    avg = rows.length ? rows.reduce((a, x) => a + x.risk, 0) / rows.length : 0;
  function exportOrders() {
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
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="logo">◎</span> operasyon<span>radar</span>
        </div>
        <div className="language-switch" role="group" aria-label={language === "en" ? "Language" : "Dil"}>
          <button className={language === "tr" ? "selected" : ""} onClick={() => changeLanguage("tr")} aria-pressed={language === "tr"}>TR</button>
          <button className={language === "en" ? "selected" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>EN</button>
        </div>
        <div className="workspace">{t.workspace}</div>
        <div className="nav active">◫ {t.overview}</div>
        <div className="nav">↗ {t.risks}</div>
        <div className="aside-note">
          {t.local}
          <br />
          <strong>React + Python + Ollama</strong>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <small>{t.eyebrow}</small>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="header-actions">
            <div className="language-switch mobile-language" role="group" aria-label={language === "en" ? "Language" : "Dil"}>
              <button className={language === "tr" ? "selected" : ""} onClick={() => changeLanguage("tr")} aria-pressed={language === "tr"}>TR</button>
              <button className={language === "en" ? "selected" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>EN</button>
            </div>
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await api("/demo", { method: "POST" }, language);
                  await refresh();
                })
              }
            >
              {t.refreshDemo}
            </button>
          </div>
        </header>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {busy && (
          <div role="status" className="notice">
            {t.busy}
          </div>
        )}
        <div className="notice">
          {data?.metrics.source === "sentetik demo"
            ? t.syntheticNotice
            : t.csvNotice}{" "}
          {t.calibration}
        </div>
        <section className="cards">
          <article>
            <small>{t.reviewed}</small>
            <strong>{rows.length}</strong>
            <span>{t.reviewedHint}</span>
          </article>
          <article>
            <small>{t.highRisk}</small>
            <strong className="orange">{high}</strong>
            <span>{t.highHint}</span>
          </article>
          <article>
            <small>{t.averageRisk}</small>
            <strong>{pct(avg)}</strong>
            <span>{t.averageHint}</span>
          </article>
          <article>
            <small>{t.rocAuc}</small>
            <strong>{data ? data.metrics.roc_auc.toFixed(2) : "—"}</strong>
            <span>{t.rocHint}</span>
          </article>
        </section>
        <section className="insights">
          <div className="panel distribution">
            <div className="panel-head">
              <div>
                <h2>{t.riskDistribution}</h2>
                <p>{t.distributionHint}</p>
              </div>
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
                  <span className="distribution-track">
                    <span
                      className={level.className}
                      style={{ width: `${rows.length ? (level.count / rows.length) * 100 : 0}%` }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="panel signal-summary">
            <div className="panel-head">
              <div>
                <h2>{t.signalFrequency}</h2>
                <p>{t.signalFrequencyHint}</p>
              </div>
              <span className="pill">{shown.length} {t.matchingOrders}</span>
            </div>
            {signalStats.length ? (
              <div className="signal-stats">
                {signalStats.map(([signal, count]) => (
                  <div className="signal-stat" key={signal}>
                    <span>{t[signalKeys[signal]] || signal}</span>
                    <div className="signal-stat-track">
                      <span style={{ width: `${(count / maxSignalCount) * 100}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">{t.noSignalMatches}</p>
            )}
          </div>
        </section>
        <div className="grid">
          <section className="panel orders">
            <div className="panel-head">
              <div>
                <h2>{t.orderRadar}</h2>
                <p>{t.sortHint}</p>
              </div>
              <span className="pill">{shown.length} {t.orderCount}</span>
            </div>
            <div className="filters">
              <input
                aria-label={t.search}
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label={t.riskFilter}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["all", "high", "medium", "low"].map((x) => (
                  <option key={x} value={x}>{t[x]}</option>
                ))}
              </select>
              <label className="date-filter">
                <span>{t.dateFrom}</span>
                <input
                  aria-label={t.dateFrom}
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="date-filter">
                <span>{t.dateTo}</span>
                <input
                  aria-label={t.dateTo}
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
              <select
                aria-label={t.sortOrders}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="risk">{t.sortRisk}</option>
                <option value="date-newest">{t.sortNewest}</option>
                <option value="date-oldest">{t.sortOldest}</option>
                <option value="order-id">{t.sortOrderId}</option>
              </select>
              <button className="export" disabled={!shown.length} onClick={exportOrders}>
                {t.exportCsv}
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.order}</th>
                    <th>{t.distance}</th>
                    <th>{t.riskScore}</th>
                    <th>{t.level}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.order_id}>
                      <td>
                        <b>{o.order_id}</b>
                        <small>{o.order_date}</small>
                      </td>
                      <td>{o.distance_km} km</td>
                      <td>
                        <div className="risk">
                          <div className="track">
                            <div style={{ width: pct(o.risk) }} />
                          </div>
                          {pct(o.risk)}
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (o.level === "Yüksek"
                              ? "high"
                              : o.level === "Orta"
                                ? "medium"
                                : "low")
                          }
                        >
                          {t[o.level === "Yüksek" ? "high" : o.level === "Orta" ? "medium" : "low"]}
                        </span>
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          onClick={() => {
                            setSelected(o);
                            setExplanation(null);
                          }}
                        >
                          {t.inspect}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!shown.length && (
                <p className="empty">
                  {t.notFound}
                </p>
              )}
            </div>
          </section>
          <section className="panel detail">
            <small className="accent">{t.insight}</small>
            <h2>{selected?.order_id || t.discover}</h2>
            {selected ? (
              <>
                <div className="big-risk">
                  {pct(selected.risk)}
                  <span>{t.modelRisk}</span>
                </div>
                <h3>{t.operationalData}</h3>
                <dl className="facts">
                  <div><dt>{t.quantity}</dt><dd>{selected.quantity} {t.units}</dd></div>
                  <div><dt>{t.supplierDelayRate}</dt><dd>{pct(selected.supplier_delay_rate)}</dd></div>
                  <div><dt>{t.workload}</dt><dd>{pct(selected.workload)}</dd></div>
                  <div><dt>{t.distance}</dt><dd>{selected.distance_km} km</dd></div>
                  <div><dt>{t.promisedDays}</dt><dd>{selected.promised_days} {t.days}</dd></div>
                </dl>
                <h3>{t.signals}</h3>
                <p className="muted">
                  {t.signalDisclaimer}
                </p>
                {selected.signals.map((s) => (
                  <div className="signal" key={s}>
                    {t[signalKeys[s]] || s}
                  </div>
                ))}
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    run(async () =>
                      setExplanation(
                        await api(
                          "/explain/" + encodeURIComponent(selected.order_id) + "?lang=" + language,
                          { method: "POST" },
                          language,
                        ),
                      ),
                    )
                  }
                >
                  {t.explain}
                </button>
                {explanation && (
                  <div className="explanation">
                    <small>
                      {explanation.source === "ollama"
                        ? t.ollamaComment
                        : t.noOllama}
                    </small>
                    <p>{explanation.text}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="radar">◎</div>
                <p>
                  {t.chooseOrder}
                </p>
              </>
            )}
          </section>
        </div>
        <section className="panel training">
          <div>
            <h2>{t.dataToModel}</h2>
            <p>
              {t.trainingHint}
            </p>
            <div className="actions">
              <label className={busy ? "disabled" : ""}>
                {t.uploadTraining}
                <input
                  disabled={busy}
                  type="file"
                  accept=".csv"
                  onChange={(e) => upload(e, "/train")}
                />
              </label>
              <label className={busy ? "disabled" : ""}>
                {t.uploadOrders}
                <input
                  disabled={busy}
                  type="file"
                  accept=".csv"
                  onChange={(e) => upload(e, "/orders")}
                />
              </label>
              <a href="/api/template/training">{t.trainingExample}</a>
              <a href="/api/template/orders">{t.ordersExample}</a>
            </div>
          </div>
          {data && (
            <div className="metrics">
              <span>
                {t.trainTest}{" "}
                <b>
                  {data.metrics.train_rows} / {data.metrics.test_rows}
                </b>
              </span>
              <span>
                {t.accuracy}{" "}
                <b>
                  {pct(data.metrics.accuracy)} /{" "}
                  {pct(data.metrics.baseline_accuracy)}
                </b>
              </span>
              <span>
                {t.precisionRecall}{" "}
                <b>
                  {pct(data.metrics.precision)} / {pct(data.metrics.recall)}
                </b>
              </span>
              <span>
                {t.brier}{" "}
                <b>{data.metrics.brier.toFixed(3)}</b>
              </span>
            </div>
          )}
        </section>
        <footer>
          {t.footer}
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
