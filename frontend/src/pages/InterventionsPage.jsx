import React, { useState } from "react";
import { deliveryWindow, expectedDeliveryDate } from "../deliveryDates.js";

const pageSize = 15;
const pct = (risk) => `${Math.round(risk * 100)}%`;

function OrderTable({ t, title, description, headers, items, emptyMessage, renderRow }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(items.length / pageSize);
  const currentPage = Math.min(page, pageCount || 1);
  const start = (currentPage - 1) * pageSize;

  return <section className="panel orders">
    <div className="panel-head">
      <div><h2>{title}</h2><p>{description}</p></div>
      <span className="pill">{items.length} {t.orderCount}</span>
    </div>
    {items.length ? <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
        <tbody>{items.slice(start, start + pageSize).map(renderRow)}</tbody>
      </table>
    </div> : <p className="empty">{emptyMessage}</p>}
    {pageCount > 1 && <nav className="schedule-pagination" aria-label={title}>
      <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>{t.previousPage}</button>
      <span aria-live="polite">{currentPage} / {pageCount}</span>
      <button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>{t.nextPage}</button>
    </nav>}
  </section>;
}

export default function InterventionsPage({ t, rows, riskChanges, getFollowUp, onSelectOrder }) {
  const { today, weekEnd } = deliveryWindow();
  const queue = rows
    .filter((order) => order.level === "Yüksek" && getFollowUp(order)?.status !== "resolved")
    .map((order) => ({ order, date: expectedDeliveryDate(order) }))
    .filter(({ date }) => date < weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || b.order.risk - a.order.risk);

  return <div className="interventions">
    <OrderTable
      t={t} title={t.interventionQueue} description={t.interventionQueueHint}
      headers={[t.order, t.expectedDelivery, t.riskScore, t.orderActions]}
      items={queue} emptyMessage={t.emptyInterventionQueue}
      renderRow={({ order, date }) => <tr key={order.order_id}>
        <td><b>{order.order_id}</b></td>
        <td>{date}{date < today && <small>{t.pastDeliveryDates}</small>}</td>
        <td>{pct(order.risk)}</td>
        <td><button onClick={() => onSelectOrder(order)}>{t.inspect}</button></td>
      </tr>}
    />
    <OrderTable
      t={t} title={t.riskChanges} description={t.riskChangesHint}
      headers={[t.order, t.riskTransition, t.previousRiskScore, t.riskScore, t.orderActions]}
      items={riskChanges ?? []} emptyMessage={riskChanges ? t.noRiskChanges : t.riskChangesUnavailable}
      renderRow={({ order, previous, enteredHighRisk }) => <tr key={order.order_id}>
        <td><b>{order.order_id}</b></td>
        <td>{enteredHighRisk ? t.enteredHighRisk : t.leftHighRisk}</td>
        <td>{pct(previous.risk)}</td>
        <td>{pct(order.risk)}</td>
        <td><button onClick={() => onSelectOrder(order)}>{t.inspect}</button></td>
      </tr>}
    />
  </div>;
}
