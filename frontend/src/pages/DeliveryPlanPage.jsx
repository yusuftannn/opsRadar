import React, { useEffect, useMemo, useState } from "react";
import { deliveryWindow, expectedDeliveryDate } from "../deliveryDates.js";

const pct = (value) => `${Math.round(value * 100)}%`;

function buildSchedule(rows) {
  const days = new Map();
  for (const order of rows) {
    const date = expectedDeliveryDate(order);
    if (!days.has(date)) days.set(date, { date, orders: [], high: 0, riskTotal: 0 });
    const day = days.get(date);
    day.orders.push(order);
    day.high += order.level === "Yüksek" ? 1 : 0;
    day.riskTotal += order.risk;
  }
  for (const day of days.values()) {
    day.orders.sort((a, b) => b.risk - a.risk);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export default function DeliveryPlanPage({ t, rows, onSelectOrder, busy, language, run, api }) {
  const [plan, setPlan] = useState(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const [expandedDate, setExpandedDate] = useState(null);
  const [deliveryPeriod, setDeliveryPeriod] = useState("all");
  useEffect(() => {
    setPlan(null);
    setSchedulePage(1);
    setExpandedDate(null);
  }, [rows, language]);
  const high = rows.filter((order) => order.level === "Yüksek").length;
  const averageRisk = rows.length ? rows.reduce((total, order) => total + order.risk, 0) / rows.length : 0;
  const schedule = useMemo(() => buildSchedule(rows), [rows]);
  const { today, weekEnd } = deliveryWindow();
  const matchingDays = schedule.filter(({ date }) => {
    if (deliveryPeriod === "past") return date < today;
    if (deliveryPeriod === "today") return date === today;
    if (deliveryPeriod === "week") return date >= today && date < weekEnd;
    return true;
  });
  const pageSize = 10;
  const pageCount = Math.ceil(matchingDays.length / pageSize);
  const currentPage = Math.min(schedulePage, pageCount || 1);
  const visibleSchedule = matchingDays.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <>
    <section className="cards schedule-cards">
      <article><small>{t.reviewed}</small><strong>{rows.length}</strong><span>{t.ordersOnSchedule}</span></article>
      <article><small>{t.highRisk}</small><strong className="orange">{high}</strong><span>{t.highHint}</span></article>
      <article><small>{t.deliveryDates}</small><strong>{schedule.length}</strong><span>{t.uniqueDeliveryDates}</span></article>
      <article><small>{t.averageRisk}</small><strong>{pct(averageRisk)}</strong><span>{t.averageHint}</span></article>
    </section>
    <section className="panel ai-brief">
      <div className="panel-head">
        <div><h2>{t.schedulePlan}</h2><p>{t.schedulePlanHint}</p></div>
        <button disabled={busy || !rows.length} onClick={() => run(async () => setPlan(await api(`/schedule-plan?lang=${language}`, { method: "POST" }, language)))}>{t.generateSchedulePlan}</button>
      </div>
      {plan && <div className="explanation"><small>{plan.source === "ollama" ? t.scheduleOllama : t.scheduleFallback}</small><p>{plan.text}</p></div>}
    </section>
    <section className="panel schedule-panel">
      <div className="panel-head">
        <div><h2>{t.deliveryLoad}</h2><p>{t.deliveryLoadHint}</p></div>
        <span className="pill" aria-live="polite">{matchingDays.length} {t.deliveryDates.toLowerCase()}</span>
      </div>
      <label className="filter-field delivery-period">
        <span>{t.deliveryPeriod}</span>
        <select value={deliveryPeriod} onChange={(event) => {
          setDeliveryPeriod(event.target.value);
          setSchedulePage(1);
          setExpandedDate(null);
        }}>
          <option value="all">{t.allDeliveryDates}</option>
          <option value="past">{t.pastDeliveryDates}</option>
          <option value="today">{t.todayDeliveryDates}</option>
          <option value="week">{t.weekDeliveryDates}</option>
        </select>
      </label>
      {matchingDays.length ? <div className="table-wrap schedule-table-wrap"><table>
        <thead><tr><th>{t.expectedDelivery}</th><th>{t.orderCount}</th><th>{t.highRisk}</th><th>{t.averageRisk}</th><th>{t.orders}</th></tr></thead>
        <tbody>{visibleSchedule.map((day) => {
          const expanded = expandedDate === day.date;
          const visibleOrders = expanded ? day.orders : day.orders.slice(0, 5);
          return <tr key={day.date}>
            <td><b>{day.date}</b></td><td>{day.orders.length}</td><td><span className="badge high">{day.high}</span></td><td>{pct(day.riskTotal / day.orders.length)}</td>
            <td>
              <div className="schedule-orders" id={`delivery-orders-${day.date}`}>
                {visibleOrders.map((order) => <button key={order.order_id} onClick={() => onSelectOrder(order)}>{order.order_id} · {pct(order.risk)}</button>)}
              </div>
              {day.orders.length > 5 && <button className="schedule-expand"
                aria-expanded={expanded} aria-controls={`delivery-orders-${day.date}`}
                onClick={() => setExpandedDate(expanded ? null : day.date)}>
                {expanded ? t.showFewerOrders : `${t.showAllOrders} (${day.orders.length})`}
              </button>}
            </td>
          </tr>;
        })}</tbody>
      </table></div> : <p className="empty">{schedule.length ? t.noMatchingDeliveryDates : t.noScheduleOrders}</p>}
      {pageCount > 1 && <nav className="schedule-pagination" aria-label={t.deliveryLoad}>
        <button disabled={currentPage === 1} onClick={() => setSchedulePage(currentPage - 1)}>{t.previousPage}</button>
        <span aria-live="polite">{currentPage} / {pageCount}</span>
        <button disabled={currentPage === pageCount} onClick={() => setSchedulePage(currentPage + 1)}>{t.nextPage}</button>
      </nav>}
    </section>
  </>;
}
