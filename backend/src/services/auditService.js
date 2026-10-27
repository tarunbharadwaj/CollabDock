import { AuditLog } from '../models/AuditLog.js';

const PRIVATE_KEYS = new Set(['bankDetails', 'upiId', 'paymentInstructions', 'referenceId']);

export function scrubAdminData(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(scrubAdminData);
  if (value instanceof Date) return value;
  if (value?._bsontype === 'ObjectId') return value.toString();
  if (typeof value !== 'object') return value;

  const source = typeof value.toObject === 'function' ? value.toObject() : value;
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => !PRIVATE_KEYS.has(key))
      .map(([key, item]) => [key, scrubAdminData(item)]),
  );
}

export function auditAdminAction(req, details) {
  return AuditLog.create({
    actorUid: req.user.uid,
    actorEmail: req.user.email,
    ...details,
    before: scrubAdminData(details.before),
    after: scrubAdminData(details.after),
    metadata: scrubAdminData(details.metadata),
  });
}

export function safeAdminUser(user) {
  const data = scrubAdminData(user);
  delete data.invoiceSequence;
  return data;
}

export function safeAdminInvoice(invoice) {
  return scrubAdminData(invoice);
}

export function safeAdminPayment(payment) {
  return scrubAdminData(payment);
}
