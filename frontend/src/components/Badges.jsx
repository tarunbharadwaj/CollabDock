const statusClass = (value) => String(value).toLowerCase().replaceAll(' ', '-');
export function StatusBadge({ value }) { return <span className={`badge badge-${statusClass(value)}`}>{value}</span>; }
export function PaymentBadge({ value }) { return <span className={`badge payment-${statusClass(value)}`}>{value}</span>; }
