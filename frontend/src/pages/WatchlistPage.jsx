import React from "react";

export default function WatchlistPage({ t, rows, onSelectOrder, onRemove, getFollowUp, onUpdate }) {
  if (!rows.length) {
    return <section className="panel"><p className="empty">{t.watchlistEmpty}</p></section>;
  }

  return <section className="panel orders">
    <div className="table-wrap">
      <table>
        <thead><tr><th>{t.order}</th><th>{t.riskScore}</th><th>{t.followUpStatus}</th><th>{t.followUpNote}</th><th colSpan="2">{t.orderActions}</th></tr></thead>
        <tbody>{rows.map((order) => {
          const { status, note } = getFollowUp(order);
          return (
            <tr key={order.order_id}>
              <td><b>{order.order_id}</b><small>{order.order_date}</small></td>
              <td>{Math.round(order.risk * 100)}%</td>
              <td>
                <select aria-label={`${order.order_id} · ${t.followUpStatus}`} value={status}
                  onChange={(event) => onUpdate(order, { status: event.target.value })}>
                  <option value="pending">{t.followUpPending}</option>
                  <option value="inProgress">{t.followUpInProgress}</option>
                  <option value="resolved">{t.followUpResolved}</option>
                </select>
              </td>
              <td>
                <textarea className="follow-up-note" rows={2} maxLength={500}
                  aria-label={`${order.order_id} · ${t.followUpNote}`}
                  value={note} onChange={(event) => onUpdate(order, { note: event.target.value })} />
              </td>
              <td><button onClick={() => onSelectOrder(order)}>{t.inspect}</button></td>
              <td><button aria-label={`${order.order_id} – ${t.unwatchOrder}`} onClick={() => onRemove(order)}>{t.unwatchOrder}</button></td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  </section>;
}
