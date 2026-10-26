export const COLLABORATION_STATUSES = ['Lead', 'Confirmed', 'In Progress', 'Content Submitted', 'Completed', 'Cancelled'];
export const DELIVERABLE_STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Published'];

export function calculateOutstanding(dealValuePaisa, receivedPaisa = 0) {
  return Math.max(0, dealValuePaisa - receivedPaisa);
}

export function paymentStatus({ dealValuePaisa, receivedPaisa = 0, paymentDueDate, now = new Date() }) {
  const outstanding = calculateOutstanding(dealValuePaisa, receivedPaisa);
  if (outstanding === 0) return 'Paid';
  const overdue = paymentDueDate && new Date(paymentDueDate).setHours(23, 59, 59, 999) < now.getTime();
  if (overdue) return 'Overdue';
  return receivedPaisa > 0 ? 'Partially Paid' : 'Unpaid';
}

export function isActiveCollaboration(collaboration) {
  if (!collaboration || ['Completed', 'Cancelled'].includes(collaboration.status)) return false;
  return paymentStatus(collaboration) !== 'Paid';
}

export function isCompletedCollaboration(collaboration) {
  if (!collaboration || collaboration.status === 'Cancelled') return false;
  return paymentStatus(collaboration) === 'Paid';
}

export function invoiceNumber(prefix, sequence, date = new Date()) {
  return `${String(prefix || 'INV').toUpperCase()}-${date.getFullYear()}-${String(sequence).padStart(4, '0')}`;
}
