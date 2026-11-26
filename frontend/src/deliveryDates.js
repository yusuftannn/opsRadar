export function expectedDeliveryDate(order) {
  const date = new Date(`${order.order_date}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(order.promised_days));
  return date.toISOString().slice(0, 10);
}

export function deliveryWindow(now = new Date()) {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const today = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 7);
  return { today, weekEnd: date.toISOString().slice(0, 10) };
}
