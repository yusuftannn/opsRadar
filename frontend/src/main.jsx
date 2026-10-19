import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";
import { messages } from "./i18n.js";
import OverviewPage from "./pages/OverviewPage.jsx";
import RiskAnalysisPage from "./pages/RiskAnalysisPage.jsx";
import DeliveryPlanPage from "./pages/DeliveryPlanPage.jsx";
import TrendsPage from "./pages/TrendsPage.jsx";

async function api(path, options, language) {
  const response = await fetch("/api" + path, options);
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      typeof body.detail === "string" ? body.detail : messages[language].apiError,
    );
  return body;
}

function App() {
  const [language, setLanguage] = useState(() =>
      localStorage.getItem("operasyon-radar-language") === "en" ? "en" : "tr",
    ),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState("overview"),
    [menuOpen, setMenuOpen] = useState(false),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [dateFrom, setDateFrom] = useState(""),
    [dateTo, setDateTo] = useState(""),
    [sortBy, setSortBy] = useState("risk"),
    [selected, setSelected] = useState(null),
    [explanation, setExplanation] = useState(null);
  const t = messages[language];

  useEffect(() => {
    localStorage.setItem("operasyon-radar-language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function refresh() {
    const nextData = await api("/dashboard", undefined, language);
    setData(nextData);
    setSelected(null);
    setExplanation(null);
  }

  useEffect(() => {
    refresh().catch((requestError) => setError(requestError.message));
  }, []);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (requestError) {
      setError(requestError.message);
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

  const rows = data?.orders || [];
  const filtered = rows.filter(
    (order) =>
      (filter === "all" || order.level === ({ high: "Yüksek", medium: "Orta", low: "Düşük" }[filter])) &&
      (!dateFrom || order.order_date >= dateFrom) &&
      (!dateTo || order.order_date <= dateTo) &&
      order.order_id.toLowerCase().includes(query.toLowerCase()),
  );
  const shown = [...filtered].sort((a, b) => {
    if (sortBy === "date-newest") return b.order_date.localeCompare(a.order_date);
    if (sortBy === "date-oldest") return a.order_date.localeCompare(b.order_date);
    if (sortBy === "order-id") return a.order_id.localeCompare(b.order_id);
    return b.risk - a.risk;
  });
  const pageTitles = {
    overview: [t.eyebrow, t.title, t.subtitle],
    analysis: [t.analysisEyebrow, t.analysisTitle, t.analysisSubtitle],
    schedule: [t.scheduleEyebrow, t.scheduleTitle, t.scheduleSubtitle],
    trends: [t.trendsEyebrow, t.trendsTitle, t.trendsSubtitle],
  }[page];

  function navigate(nextPage) {
    setPage(nextPage);
    setMenuOpen(false);
    setSelected(null);
    setExplanation(null);
  }

  function openOrder(order) {
    setSelected(order);
    setExplanation(null);
    setPage("overview");
  }

  return (
    <div className="shell">
      <aside id="page-sidebar" className={menuOpen ? "sidebar sidebar-open" : "sidebar"} aria-label={t.pageNavigation}>
        <div className="brand"><span className="logo">◎</span> operasyon<span>radar</span></div>
        <div className="language-switch" role="group" aria-label={language === "en" ? "Language" : "Dil"}>
          <button className={language === "tr" ? "selected" : ""} onClick={() => setLanguage("tr")} aria-pressed={language === "tr"}>TR</button>
          <button className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
        </div>
        <div className="workspace">{t.workspace}</div>
        <nav className="sidebar-nav" aria-label={t.pageNavigation}>
          <button className={`nav ${page === "overview" ? "active" : ""}`} aria-current={page === "overview" ? "page" : undefined} onClick={() => navigate("overview")}>◫ {t.overview}</button>
          <button className={`nav ${page === "analysis" ? "active" : ""}`} aria-current={page === "analysis" ? "page" : undefined} onClick={() => navigate("analysis")}>↗ {t.risks}</button>
          <button className={`nav ${page === "schedule" ? "active" : ""}`} aria-current={page === "schedule" ? "page" : undefined} onClick={() => navigate("schedule")}>▦ {t.deliveryPlan}</button>
          <button className={`nav ${page === "trends" ? "active" : ""}`} aria-current={page === "trends" ? "page" : undefined} onClick={() => navigate("trends")}>⌁ {t.trends}</button>
        </nav>
        <div className="aside-note">{t.local}<br /><strong>React + Python + Ollama</strong></div>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)} />}
      <main>
        <header>
          <div className="page-heading">
            <button
              className="mobile-menu-toggle"
              aria-label={menuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={menuOpen}
              aria-controls="page-sidebar"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="menu-icon" aria-hidden="true"><span /><span /><span /></span>
            </button>
            <div>
              <small>{pageTitles[0]}</small>
              <h1>{pageTitles[1]}</h1>
              <p>{pageTitles[2]}</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="language-switch mobile-language" role="group" aria-label={language === "en" ? "Language" : "Dil"}>
              <button className={language === "tr" ? "selected" : ""} onClick={() => setLanguage("tr")} aria-pressed={language === "tr"}>TR</button>
              <button className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
            </div>
            <button disabled={busy} onClick={() => run(async () => {
              await api("/demo", { method: "POST" }, language);
              await refresh();
            })}>{t.refreshDemo}</button>
          </div>
        </header>
        {error && <div role="alert" className="error">{error}</div>}
        {busy && <div role="status" className="notice">{t.busy}</div>}
        <div className="notice">
          {data?.metrics.source === "sentetik demo" ? t.syntheticNotice : t.csvNotice} {t.calibration}
        </div>
        {page === "overview" && <OverviewPage
          t={t} rows={rows} shown={shown} filter={filter} setFilter={setFilter}
          data={data} busy={busy} language={language} selected={selected}
          setSelected={setSelected} explanation={explanation} setExplanation={setExplanation}
          run={run} api={api} upload={upload} query={query} setQuery={setQuery}
          dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
          sortBy={sortBy} setSortBy={setSortBy}
        />}
        {page === "analysis" && <RiskAnalysisPage t={t} rows={rows} metrics={data?.metrics} onSelectOrder={openOrder} />}
        {page === "schedule" && <DeliveryPlanPage t={t} rows={rows} onSelectOrder={openOrder} busy={busy} language={language} run={run} api={api} />}
        {page === "trends" && <TrendsPage t={t} rows={rows} />}
        <footer>{t.footer}</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
