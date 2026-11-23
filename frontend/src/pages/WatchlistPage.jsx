import React from "react";

export default function WatchlistPage({ t, rows, onSelectOrder, onRemove }) {
  if (!rows.length) {
    return <section className="panel"><p className="empty">{t.watchlistEmpty}</p></section>;
  }

  return <section className="panel orders">
    <div className="table-wrap">
      <table>
        <thead><tr><th>{t.order}</th><th>{t.riskScore}</th><th colSpan="2">{t.orderActions}</th></tr></thead>
        <tbody>{rows.map((order) => (
          <tr key={order.order_id}>
            <td><b>{order.order_id}</b><small>{order.order_date}</small></td>
            <td>{Math.round(order.risk * 100)}%</td>
            <td><button onClick={() => onSelectOrder(order)}>{t.inspect}</button></td>
            <td><button aria-label={`${order.order_id} – ${t.unwatchOrder}`} onClick={() => onRemove(order)}>{t.unwatchOrder}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </section>;
}
