import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const pct = (v) => `${Math.round(v * 100)}%`;
async function api(path, options) {
  const r = await fetch("/api" + path, options);
  const b = await r.json();
  if (!r.ok)
    throw new Error(
      typeof b.detail === "string" ? b.detail : "İşlem başarısız.",
    );
  return b;
}
function App() {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("Tümü"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(null),
    [explanation, setExplanation] = useState(null);
  async function refresh() {
    const d = await api("/dashboard");
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
      await api(path, { method: "POST", body });
      await refresh();
    });
  }
  const rows = data?.orders || [],
    shown = rows.filter(
      (x) =>
        (filter === "Tümü" || x.level === filter) &&
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
        <div className="workspace">OPERASYON MERKEZİ</div>
        <div className="nav active">◫ Genel bakış</div>
        <div className="nav">↗ Sipariş riskleri</div>
        <div className="aside-note">
          Yerel geliştirme sürümü
          <br />
          <strong>React + Python + Ollama</strong>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <small>OPERASYON / GENEL BAKIŞ</small>
            <h1>Gecikmeden önce harekete geç.</h1>
            <p>
              Sipariş risklerini gör, önceliklerini belirle, veriyi aksiyona
              dönüştür.
            </p>
          </div>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await api("/demo", { method: "POST" });
                await refresh();
              })
            }
          >
            Demo verisini yenile
          </button>
        </header>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {busy && (
          <div role="status" className="notice">
            İşlem sürüyor…
          </div>
        )}
        <div className="notice">
          {data?.metrics.source === "sentetik demo"
            ? "SENTETİK DEMO - Sonuçlar gerçek firma performansını göstermez."
            : "CSV MODELİ • Tahmin için açık sipariş CSV’sini yükleyin."}{" "}
          Risk skorları kalibrasyon garantisi taşımaz.
        </div>
        <section className="cards">
          <article>
            <small>İNCELENEN SİPARİŞ</small>
            <strong>{rows.length}</strong>
            <span>Tahmin bekleyen operasyonlar</span>
          </article>
          <article>
            <small>YÜKSEK RİSK</small>
            <strong className="orange">{high}</strong>
            <span>%65 ve üzeri model skoru</span>
          </article>
          <article>
            <small>ORTALAMA RİSK SKORU</small>
            <strong>{pct(avg)}</strong>
            <span>Mevcut sipariş havuzu</span>
          </article>
          <article>
            <small>TEST ROC-AUC</small>
            <strong>{data ? data.metrics.roc_auc.toFixed(2) : "—"}</strong>
            <span>Tarihe göre ayrılan test kümesi</span>
          </article>
        </section>
        <div className="grid">
          <section className="panel orders">
            <div className="panel-head">
              <div>
                <h2>Sipariş radarın</h2>
                <p>En yüksek riskli siparişler önce listelenir.</p>
              </div>
              <span className="pill">{shown.length} sipariş</span>
            </div>
            <div className="filters">
              <input
                aria-label="Sipariş ara"
                placeholder="Sipariş numarası ara…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="Risk filtresi"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["Tümü", "Yüksek", "Orta", "Düşük"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sipariş</th>
                    <th>Mesafe</th>
                    <th>Risk skoru</th>
                    <th>Seviye</th>
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
                          {o.level}
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
                          İncele →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!shown.length && (
                <p className="empty">
                  Sipariş bulunamadı. Açık sipariş CSV’si yükleyin.
                </p>
              )}
            </div>
          </section>
          <section className="panel detail">
            <small className="accent">SİPARİŞ İÇGÖRÜSÜ</small>
            <h2>{selected?.order_id || "Önceliğini keşfet"}</h2>
            {selected ? (
              <>
                <div className="big-risk">
                  {pct(selected.risk)}
                  <span>model risk skoru</span>
                </div>
                <p>
                  {selected.quantity} adet · {selected.promised_days} gün
                  taahhüt
                </p>
                <h3>Operasyon sinyalleri</h3>
                <p className="muted">
                  Eşik tabanlı gözlemler; modelin nedensel açıklaması değildir.
                </p>
                {selected.signals.map((s) => (
                  <div className="signal" key={s}>
                    {s}
                  </div>
                ))}
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    run(async () =>
                      setExplanation(
                        await api(
                          "/explain/" + encodeURIComponent(selected.order_id),
                          { method: "POST" },
                        ),
                      ),
                    )
                  }
                >
                  Ollama ile yorumla
                </button>
                {explanation && (
                  <div className="explanation">
                    <small>
                      {explanation.source === "ollama"
                        ? "OLLAMA YORUMU"
                        : "OLLAMA BAĞLANTISI YOK • KURAL ÖZETİ"}
                    </small>
                    <p>{explanation.text}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="radar">◎</div>
                <p>
                  Bir sipariş seçerek operasyon sinyallerini ve AI yorumunu
                  incele.
                </p>
              </>
            )}
          </section>
        </div>
        <section className="panel training">
          <div>
            <h2>Veriden modele</h2>
            <p>
              Önce tamamlanmış siparişlerle eğit, ardından açık siparişleri
              analiz et.
            </p>
            <div className="actions">
              <label className={busy ? "disabled" : ""}>
                1. Eğitim CSV’si yükle
                <input
                  disabled={busy}
                  type="file"
                  accept=".csv"
                  onChange={(e) => upload(e, "/train")}
                />
              </label>
              <label className={busy ? "disabled" : ""}>
                2. Sipariş CSV’si yükle
                <input
                  disabled={busy}
                  type="file"
                  accept=".csv"
                  onChange={(e) => upload(e, "/orders")}
                />
              </label>
              <a href="/api/template/training">Eğitim örneği ↓</a>
              <a href="/api/template/orders">Sipariş örneği ↓</a>
            </div>
          </div>
          {data && (
            <div className="metrics">
              <span>
                Eğitim / test{" "}
                <b>
                  {data.metrics.train_rows} / {data.metrics.test_rows}
                </b>
              </span>
              <span>
                Doğruluk / temel model{" "}
                <b>
                  {pct(data.metrics.accuracy)} /{" "}
                  {pct(data.metrics.baseline_accuracy)}
                </b>
              </span>
              <span>
                Kesinlik / duyarlılık{" "}
                <b>
                  {pct(data.metrics.precision)} / {pct(data.metrics.recall)}
                </b>
              </span>
              <span>
                Brier skoru (düşük daha iyi){" "}
                <b>{data.metrics.brier.toFixed(3)}</b>
              </span>
            </div>
          )}
        </section>
        <footer>
          Operasyon Radar · v0.1 · Model yeniden başlatmada demo verisine döner.
          CSV verileri diske kaydedilmez.
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
