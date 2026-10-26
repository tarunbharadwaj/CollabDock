import { format, formatDistanceToNow, isPast } from 'date-fns';

export const inr = (paisa = 0, decimals = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(paisa / 100);
export const shortDate = (value) => value ? format(new Date(value), 'dd MMM yyyy') : 'No date';
export const relativeDate = (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : 'No deadline';
export const isOverdue = (value) => Boolean(value && isPast(new Date(value)));
export const toPaisa = (rupees) => Math.round(Number(rupees || 0) * 100);
export const toRupees = (paisa) => Number(paisa || 0) / 100;

export function normalizeMoneyInput(value) {
  const cleaned = String(value ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const [whole = '', ...decimalParts] = cleaned.split('.');
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '');
  if (!decimalParts.length) return normalizedWhole;
  return `${normalizedWhole || '0'}.${decimalParts.join('').slice(0, 2)}`;
}

export function formatIndianNumberInput(value) {
  const normalized = normalizeMoneyInput(value);
  if (!normalized) return '';
  const hasDecimal = normalized.includes('.');
  const [whole, decimal = ''] = normalized.split('.');
  const finalThree = whole.slice(-3);
  const leading = whole.slice(0, -3);
  const groupedLeading = leading.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = leading ? `${groupedLeading},${finalThree}` : finalThree;
  return hasDecimal ? `${grouped}.${decimal}` : grouped;
}

export function reminderMessage(collaboration) {
  const name = collaboration.brandContactName || 'there';
  const dueDateLine = collaboration.paymentDueDate
    ? `\n\nThe payment was due on ${shortDate(collaboration.paymentDueDate)}.`
    : '';
  return `Hi ${name}, hope you're doing well!\n\nJust following up on the pending payment of ${inr(collaboration.outstandingPaisa)} for our collaboration with ${collaboration.brandName}.${dueDateLine}\n\nCould you please share an update on when I can expect it?\n\nThanks!`;
}

export function whatsappUrl(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  const international = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
