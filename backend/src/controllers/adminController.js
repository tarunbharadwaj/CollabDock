import mongoose from 'mongoose';
import { firebaseAuth } from '../config/firebase.js';
import { User } from '../models/User.js';
import { Collaboration } from '../models/Collaboration.js';
import { Deliverable } from '../models/Deliverable.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { AuditLog } from '../models/AuditLog.js';
import { Feedback } from '../models/Feedback.js';
import { AppError } from '../utils/errors.js';
import { invoiceNumber, paymentStatus } from '../utils/finance.js';
import { auditAdminAction, safeAdminInvoice, safeAdminPayment, safeAdminUser, scrubAdminData } from '../services/auditService.js';

const userProjection = '-bankDetails -upiId -invoiceSequence';
const invoiceProjection = '-paymentInstructions';
const paymentProjection = '-referenceId';

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'Invalid resource ID', 'INVALID_ID');
}

function pageMeta(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertNotSelf(req, uid) {
  if (req.user.uid === uid) throw new AppError(400, 'You cannot perform this action on your own administrator account', 'SELF_ADMIN_ACTION');
}

async function findUser(uid) {
  const user = await User.findOne({ uid }).select(userProjection);
  if (!user) throw new AppError(404, 'Creator not found', 'NOT_FOUND');
  return user;
}

export async function reconcileCollaboration(collaborationId, session) {
  const collaboration = await Collaboration.findById(collaborationId).session(session);
  if (!collaboration) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  const [summary] = await Payment.aggregate([
    { $match: { collaboration: collaboration._id } },
    { $group: { _id: null, total: { $sum: '$amountPaisa' } } },
  ]).session(session);
  const total = summary?.total || 0;
  if (total > collaboration.dealValuePaisa) throw new AppError(400, 'Payments cannot exceed the collaboration value', 'PAYMENT_EXCEEDS_BALANCE');
  collaboration.receivedPaisa = total;
  if (total === collaboration.dealValuePaisa && collaboration.status !== 'Cancelled') collaboration.status = 'Completed';
  else if (total < collaboration.dealValuePaisa && collaboration.status === 'Completed') collaboration.status = 'In Progress';
  await collaboration.save({ session });
  return collaboration;
}

export async function adminMe(req, res) {
  const newFeedbackCount = await Feedback.countDocuments({ status: 'New' });
  res.json({ data: { uid: req.user.uid, email: req.user.email, admin: true, newFeedbackCount } });
}

export async function adminOverview(_req, res) {
  const [
    totalCreators,
    onboardedCreators,
    suspendedCreators,
    collaborationTotals,
    issuedInvoices,
    voidInvoices,
    recentCreators,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ onboardingCompleted: true }),
    User.countDocuments({ accountStatus: 'Suspended' }),
    Collaboration.aggregate([
      { $group: {
        _id: null,
        collaborations: { $sum: 1 },
        dealValuePaisa: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, '$dealValuePaisa', 0] } },
        paymentsReceivedPaisa: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, '$receivedPaisa', 0] } },
        pendingPaymentsPaisa: { $sum: { $cond: [{ $ne: ['$status', 'Cancelled'] }, { $max: [0, { $subtract: ['$dealValuePaisa', '$receivedPaisa'] }] }, 0] } },
      } },
    ]),
    Invoice.countDocuments({ status: { $ne: 'Void' } }),
    Invoice.countDocuments({ status: 'Void' }),
    User.find().select(userProjection).sort({ createdAt: -1 }).limit(6),
  ]);
  const financials = collaborationTotals[0] || { collaborations: 0, dealValuePaisa: 0, paymentsReceivedPaisa: 0, pendingPaymentsPaisa: 0 };
  res.json({
    data: {
      metrics: { totalCreators, onboardedCreators, suspendedCreators, issuedInvoices, voidInvoices, ...financials },
      recentCreators: recentCreators.map(safeAdminUser),
    },
  });
}

export async function listAdminUsers(req, res) {
  const { page, limit, search, status, onboarding, sort } = req.validatedQuery;
  const query = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$and = [{ $or: [{ displayName: pattern }, { email: pattern }, { instagramHandle: pattern }] }];
  }
  if (status === 'Active') {
    query.$and = [...(query.$and || []), { $or: [{ accountStatus: 'Active' }, { accountStatus: { $exists: false } }] }];
  } else if (status) query.accountStatus = status;
  if (onboarding) query.onboardingCompleted = onboarding === 'complete';
  const sortValue = sort === 'oldest' ? { createdAt: 1 } : sort === 'name' ? { displayName: 1, createdAt: -1 } : { createdAt: -1 };
  const [users, total] = await Promise.all([
    User.find(query).select(userProjection).sort(sortValue).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);
  const uids = users.map((user) => user.uid);
  const collaborationCounts = await Collaboration.aggregate([
    { $match: { ownerUid: { $in: uids } } },
    { $group: { _id: '$ownerUid', collaborations: { $sum: 1 }, dealValuePaisa: { $sum: '$dealValuePaisa' }, receivedPaisa: { $sum: '$receivedPaisa' } } },
  ]);
  const totals = new Map(collaborationCounts.map((item) => [item._id, item]));
  const data = users.map((user) => ({ ...safeAdminUser(user), summary: totals.get(user.uid) || { collaborations: 0, dealValuePaisa: 0, receivedPaisa: 0 } }));
  res.json({ data, meta: pageMeta(page, limit, total) });
}

export async function getAdminUser(req, res) {
  const user = await findUser(req.params.uid);
  const [collaborations, payments, invoices] = await Promise.all([
    Collaboration.countDocuments({ ownerUid: user.uid }),
    Payment.aggregate([{ $match: { ownerUid: user.uid } }, { $group: { _id: null, total: { $sum: '$amountPaisa' }, count: { $sum: 1 } } }]),
    Invoice.countDocuments({ ownerUid: user.uid }),
  ]);
  res.json({ data: { ...safeAdminUser(user), summary: { collaborations, payments: payments[0]?.count || 0, paymentsReceivedPaisa: payments[0]?.total || 0, invoices } } });
}

export async function updateAdminUser(req, res) {
  const existing = await findUser(req.params.uid);
  const updated = await User.findOneAndUpdate({ uid: req.params.uid }, { $set: req.body.changes }, { new: true, runValidators: true }).select(userProjection);
  await auditAdminAction(req, { action: 'user.updated', targetType: 'User', targetId: req.params.uid, targetOwnerUid: req.params.uid, reason: req.body.reason, before: existing, after: updated });
  res.json({ data: safeAdminUser(updated) });
}

export async function suspendAdminUser(req, res) {
  assertNotSelf(req, req.params.uid);
  const existing = await findUser(req.params.uid);
  await firebaseAuth.updateUser(req.params.uid, { disabled: true });
  await firebaseAuth.revokeRefreshTokens(req.params.uid);
  const updated = await User.findOneAndUpdate({ uid: req.params.uid }, { $set: { accountStatus: 'Suspended', suspendedAt: new Date(), suspendedByUid: req.user.uid, suspensionReason: req.body.reason } }, { new: true }).select(userProjection);
  await auditAdminAction(req, { action: 'user.suspended', targetType: 'User', targetId: req.params.uid, targetOwnerUid: req.params.uid, reason: req.body.reason, before: existing, after: updated });
  res.json({ data: safeAdminUser(updated) });
}

export async function reactivateAdminUser(req, res) {
  assertNotSelf(req, req.params.uid);
  const existing = await findUser(req.params.uid);
  await firebaseAuth.updateUser(req.params.uid, { disabled: false });
  const updated = await User.findOneAndUpdate({ uid: req.params.uid }, { $set: { accountStatus: 'Active', suspendedAt: null, suspendedByUid: '', suspensionReason: '' } }, { new: true }).select(userProjection);
  await auditAdminAction(req, { action: 'user.reactivated', targetType: 'User', targetId: req.params.uid, targetOwnerUid: req.params.uid, reason: req.body.reason, before: existing, after: updated });
  res.json({ data: safeAdminUser(updated) });
}

export async function deleteAdminUser(req, res) {
  assertNotSelf(req, req.params.uid);
  const existing = await findUser(req.params.uid);
  if (existing.email.toLowerCase() !== req.body.confirmationEmail.toLowerCase()) throw new AppError(400, 'The confirmation email does not match', 'CONFIRMATION_MISMATCH');
  await User.updateOne({ uid: req.params.uid }, { $set: { accountStatus: 'Deletion Pending' } });
  try {
    await firebaseAuth.updateUser(req.params.uid, { disabled: true });
    await firebaseAuth.revokeRefreshTokens(req.params.uid);
    await firebaseAuth.deleteUser(req.params.uid);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      await auditAdminAction(req, { action: 'user.deletion_failed', targetType: 'User', targetId: req.params.uid, targetOwnerUid: req.params.uid, reason: req.body.reason, before: existing, after: { accountStatus: 'Deletion Pending' }, metadata: { stage: 'firebase', errorCode: error.code || 'unknown' } });
      throw new AppError(502, 'Firebase could not remove this account. The deletion can be retried.', 'FIREBASE_DELETE_FAILED');
    }
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Deliverable.deleteMany({ ownerUid: req.params.uid }).session(session);
      await Payment.deleteMany({ ownerUid: req.params.uid }).session(session);
      await Invoice.deleteMany({ ownerUid: req.params.uid }).session(session);
      await Feedback.deleteMany({ ownerUid: req.params.uid }).session(session);
      await Collaboration.deleteMany({ ownerUid: req.params.uid }).session(session);
      await User.deleteOne({ uid: req.params.uid }).session(session);
    });
  } catch (error) {
    await auditAdminAction(req, { action: 'user.deletion_failed', targetType: 'User', targetId: req.params.uid, targetOwnerUid: req.params.uid, reason: req.body.reason, before: existing, after: { accountStatus: 'Deletion Pending' }, metadata: { stage: 'database' } });
    throw error;
  } finally {
    await session.endSession();
  }
  await auditAdminAction(req, { action: 'user.deleted', targetType: 'User', targetId: req.params.uid, targetOwnerUid: req.params.uid, reason: req.body.reason, before: existing, after: null });
  res.status(204).send();
}

async function listOwned(req, res, Model, sort, projection = '') {
  const { page, limit } = req.validatedQuery;
  await findUser(req.params.uid);
  const query = { ownerUid: req.params.uid };
  const [items, total] = await Promise.all([
    Model.find(query).select(projection).sort(sort).skip((page - 1) * limit).limit(limit),
    Model.countDocuments(query),
  ]);
  res.json({ data: items.map(scrubAdminData), meta: pageMeta(page, limit, total) });
}

export const listAdminCollaborations = (req, res) => listOwned(req, res, Collaboration, { updatedAt: -1 });
export const listAdminPayments = (req, res) => listOwned(req, res, Payment, { paymentDate: -1 }, paymentProjection);
export const listAdminInvoices = (req, res) => listOwned(req, res, Invoice, { createdAt: -1 }, invoiceProjection);

export async function getAdminCollaboration(req, res) {
  assertObjectId(req.params.id);
  const collaboration = await Collaboration.findById(req.params.id);
  if (!collaboration) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  const [deliverables, payments, invoices] = await Promise.all([
    Deliverable.find({ collaboration: collaboration._id }).sort({ dueDate: 1 }),
    Payment.find({ collaboration: collaboration._id }).select(paymentProjection).sort({ paymentDate: -1 }),
    Invoice.find({ collaboration: collaboration._id }).select(invoiceProjection).sort({ createdAt: -1 }),
  ]);
  res.json({ data: scrubAdminData({ ...collaboration.toObject(), paymentStatus: paymentStatus(collaboration), deliverables, payments, invoices }) });
}

export async function updateAdminCollaboration(req, res) {
  assertObjectId(req.params.id);
  const existing = await Collaboration.findById(req.params.id);
  if (!existing) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  if (req.body.changes.dealValuePaisa !== undefined && req.body.changes.dealValuePaisa < existing.receivedPaisa) throw new AppError(400, 'Deal value cannot be lower than recorded payments');
  const updated = await Collaboration.findByIdAndUpdate(req.params.id, req.body.changes, { new: true, runValidators: true });
  await auditAdminAction(req, { action: 'collaboration.updated', targetType: 'Collaboration', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before: existing, after: updated });
  res.json({ data: scrubAdminData(updated) });
}

export async function deleteAdminCollaboration(req, res) {
  assertObjectId(req.params.id);
  const existing = await Collaboration.findById(req.params.id);
  if (!existing) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  await Promise.all([
    Deliverable.deleteMany({ collaboration: existing._id }),
    Payment.deleteMany({ collaboration: existing._id }),
    Invoice.updateMany({ collaboration: existing._id }, { $set: { collaboration: null } }),
    existing.deleteOne(),
  ]);
  await auditAdminAction(req, { action: 'collaboration.deleted', targetType: 'Collaboration', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before: existing, after: null });
  res.status(204).send();
}

export async function updateAdminDeliverable(req, res) {
  assertObjectId(req.params.id);
  const existing = await Deliverable.findById(req.params.id);
  if (!existing) throw new AppError(404, 'Deliverable not found', 'NOT_FOUND');
  const updated = await Deliverable.findByIdAndUpdate(req.params.id, req.body.changes, { new: true, runValidators: true });
  await auditAdminAction(req, { action: 'deliverable.updated', targetType: 'Deliverable', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before: existing, after: updated });
  res.json({ data: scrubAdminData(updated) });
}

export async function deleteAdminDeliverable(req, res) {
  assertObjectId(req.params.id);
  const existing = await Deliverable.findByIdAndDelete(req.params.id);
  if (!existing) throw new AppError(404, 'Deliverable not found', 'NOT_FOUND');
  await auditAdminAction(req, { action: 'deliverable.deleted', targetType: 'Deliverable', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before: existing, after: null });
  res.status(204).send();
}

export async function createAdminPayment(req, res) {
  assertObjectId(req.body.collaborationId);
  const session = await mongoose.startSession();
  let payment;
  let collaboration;
  try {
    await session.withTransaction(async () => {
      collaboration = await Collaboration.findOne({ _id: req.body.collaborationId, ownerUid: req.params.uid, status: { $ne: 'Cancelled' } }).session(session);
      if (!collaboration) throw new AppError(404, 'Collaboration not found or unavailable', 'NOT_FOUND');
      [payment] = await Payment.create([{ ...req.body.payment, ownerUid: req.params.uid, collaboration: collaboration._id }], { session });
      collaboration = await reconcileCollaboration(collaboration._id, session);
    });
  } finally {
    await session.endSession();
  }
  await auditAdminAction(req, { action: 'payment.created', targetType: 'Payment', targetId: String(payment._id), targetOwnerUid: req.params.uid, reason: req.body.reason, before: null, after: payment, metadata: { collaborationId: String(collaboration._id) } });
  res.status(201).json({ data: safeAdminPayment(payment) });
}

export async function updateAdminPayment(req, res) {
  assertObjectId(req.params.id);
  const session = await mongoose.startSession();
  let existing;
  let updated;
  try {
    await session.withTransaction(async () => {
      existing = await Payment.findById(req.params.id).session(session);
      if (!existing) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
      updated = await Payment.findByIdAndUpdate(req.params.id, req.body.changes, { new: true, runValidators: true, session });
      await reconcileCollaboration(existing.collaboration, session);
    });
  } finally {
    await session.endSession();
  }
  await auditAdminAction(req, { action: 'payment.updated', targetType: 'Payment', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before: existing, after: updated });
  res.json({ data: safeAdminPayment(updated) });
}

export async function deleteAdminPayment(req, res) {
  assertObjectId(req.params.id);
  const session = await mongoose.startSession();
  let existing;
  try {
    await session.withTransaction(async () => {
      existing = await Payment.findByIdAndDelete(req.params.id, { session });
      if (!existing) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
      await reconcileCollaboration(existing.collaboration, session);
    });
  } finally {
    await session.endSession();
  }
  await auditAdminAction(req, { action: 'payment.deleted', targetType: 'Payment', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before: existing, after: null });
  res.status(204).send();
}

export async function voidAndRecreateAdminInvoice(req, res) {
  assertObjectId(req.params.id);
  const session = await mongoose.startSession();
  let existing;
  let replacement;
  let before;
  try {
    await session.withTransaction(async () => {
      existing = await Invoice.findById(req.params.id).session(session);
      if (!existing) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
      if (existing.status === 'Void') throw new AppError(400, 'This invoice has already been voided', 'INVOICE_VOID');
      before = existing.toObject();
      const creator = await User.findOneAndUpdate({ uid: existing.ownerUid }, { $inc: { invoiceSequence: 1 } }, { new: true, session });
      if (!creator) throw new AppError(404, 'Creator not found', 'NOT_FOUND');
      const lineItems = req.body.invoice.lineItems.map((item) => ({ ...item, amountPaisa: Math.round(item.quantity * item.ratePaisa) }));
      const totalPaisa = lineItems.reduce((sum, item) => sum + item.amountPaisa, 0);
      [replacement] = await Invoice.create([{
        ...req.body.invoice,
        ownerUid: existing.ownerUid,
        collaboration: existing.collaboration,
        invoiceNumber: invoiceNumber(creator.invoicePrefix, creator.invoiceSequence),
        lineItems,
        totalPaisa,
        paymentInstructions: existing.paymentInstructions,
        currency: 'INR',
        status: 'Issued',
        replacesInvoice: existing._id,
      }], { session });
      existing.status = 'Void';
      existing.voidedAt = new Date();
      existing.voidedByUid = req.user.uid;
      existing.voidReason = req.body.reason;
      existing.replacedByInvoice = replacement._id;
      await existing.save({ session });
    });
  } finally {
    await session.endSession();
  }
  await auditAdminAction(req, { action: 'invoice.voided_and_recreated', targetType: 'Invoice', targetId: String(existing._id), targetOwnerUid: existing.ownerUid, reason: req.body.reason, before, after: replacement, metadata: { replacementInvoiceId: String(replacement._id) } });
  res.status(201).json({ data: { voided: safeAdminInvoice(existing), replacement: safeAdminInvoice(replacement) } });
}

export async function listAdminAuditLogs(req, res) {
  const { page, limit, action, targetOwnerUid } = req.validatedQuery;
  const query = {};
  if (action) query.action = action;
  if (targetOwnerUid) query.targetOwnerUid = targetOwnerUid;
  const [items, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(query),
  ]);
  res.json({ data: items.map(scrubAdminData), meta: pageMeta(page, limit, total) });
}
