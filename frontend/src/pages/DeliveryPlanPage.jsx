import React, { useEffect, useState } from "react";

const pct = (value) => `${Math.round(value * 100)}%`;

export default function DeliveryPlanPage({ t, rows, onSelectOrder, busy, language, run, api }) {
  const [plan, setPlan] = useState(null);
  const [schedulePage, setSchedulePage] = useState(1);
  useEffect(() => {
    setPlan(null);
    setSchedulePage(1);
  }, [rows, language]);
  const high = rows.filter((order) => order.level === "Yüksek").length;
  const averageRisk = rows.length ? rows.reduce((total, order) => total + order.risk, 0) / rows.length : 0;
  const schedule = Object.values(rows.reduce((dates, order) => {
    const deliveryDate = new Date(`${order.order_date}T00:00:00Z`);
    deliveryDate.setUTCDate(deliveryDate.getUTCDate() + Number(order.promised_days));
    const date = deliveryDate.toISOString().slice(0, 10);
    dates[date] ||= { date, orders: [], high: 0, riskTotal: 0 };
    dates[date].orders.push(order);
    dates[date].high += order.level === "Yüksek" ? 1 : 0;
    dates[date].riskTotal += order.risk;
    return dates;
  }, {})).sort((a, b) => a.date.localeCompare(b.date));
  const pageSize = 10;
  const pageCount = Math.ceil(schedule.length / pageSize);
  const visibleSchedule = schedule.slice((schedulePage - 1) * pageSize, schedulePage * pageSize);

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
      <div className="panel-head"><div><h2>{t.deliveryLoad}</h2><p>{t.deliveryLoadHint}</p></div><span className="pill">{schedule.length} {t.deliveryDates.toLowerCase()}</span></div>
      {schedule.length ? <div className="table-wrap schedule-table-wrap"><table>
        <thead><tr><th>{t.expectedDelivery}</th><th>{t.orderCount}</th><th>{t.highRisk}</th><th>{t.averageRisk}</th><th>{t.orders}</th></tr></thead>
        <tbody>{visibleSchedule.map((day) => <tr key={day.date}>
          <td><b>{day.date}</b></td><td>{day.orders.length}</td><td><span className="badge high">{day.high}</span></td><td>{pct(day.riskTotal / day.orders.length)}</td>
          <td><div className="schedule-orders">{day.orders.slice(0, 5).map((order) => <button key={order.order_id} onClick={() => onSelectOrder(order)}>{order.order_id}</button>)}{day.orders.length > 5 && <span>+{day.orders.length - 5}</span>}</div></td>
        </tr>)}</tbody>
      </table></div> : <p className="empty">{t.noScheduleOrders}</p>}
      {pageCount > 1 && <nav className="schedule-pagination" aria-label={t.deliveryLoad}>
        <button disabled={schedulePage === 1} onClick={() => setSchedulePage(schedulePage - 1)}>{t.previousPage}</button>
        <span aria-live="polite">{schedulePage} / {pageCount}</span>
        <button disabled={schedulePage === pageCount} onClick={() => setSchedulePage(schedulePage + 1)}>{t.nextPage}</button>
      </nav>}
    </section>
  </>;
}