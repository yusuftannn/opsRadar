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
    shown = rows.filter(
      (x) =>
        (filter === "all" || x.level === ({ high: "Yüksek", medium: "Orta", low: "Düşük" }[filter])) &&
        x.order_id.toLowerCase().includes(query.toLowerCase()),
    );
  const high = rows.filter((x) => x.level === "Yüksek").length,
    avg = rows.length ? rows.reduce((a, x) => a + x.risk, 0) / rows.length : 0;
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
                <p>
                  {selected.quantity} {t.units} · {selected.promised_days} {t.days}
                </p>
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
