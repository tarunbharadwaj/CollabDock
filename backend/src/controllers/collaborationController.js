import mongoose from 'mongoose';
import { Collaboration } from '../models/Collaboration.js';
import { Deliverable } from '../models/Deliverable.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { AppError } from '../utils/errors.js';
import { paymentStatus } from '../utils/finance.js';

const assertId = (id) => { if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'Invalid resource ID', 'INVALID_ID'); };
const decorate = (item) => {
  const data = item.toObject();
  const fullyPaid = item.dealValuePaisa > 0 && item.receivedPaisa >= item.dealValuePaisa;
  return {
    ...data,
    status: fullyPaid ? 'Completed' : data.status,
    outstandingPaisa: Math.max(0, item.dealValuePaisa - item.receivedPaisa),
    paymentStatus: paymentStatus(item),
  };
};

export async function listCollaborations(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const query = { ownerUid: req.user.uid };
  if (req.query.status) query.status = req.query.status;
  if (req.query.paymentStatus === 'paid') {
    query.dealValuePaisa = { $gt: 0 };
    query.$expr = { $gte: ['$receivedPaisa', '$dealValuePaisa'] };
  } else if (req.query.paymentStatus === 'outstanding') {
    query.$expr = { $lt: ['$receivedPaisa', '$dealValuePaisa'] };
  }
  if (req.query.search) query.$text = { $search: req.query.search.slice(0, 100) };
  const sort = req.query.sort === 'deadline' ? { deadline: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Collaboration.find(query).sort(sort).skip((page - 1) * limit).limit(limit),
    Collaboration.countDocuments(query),
  ]);
  let data = items.map(decorate);
  if (req.query.paymentStatus === 'paid' && items.length) {
    const paymentDates = await Payment.aggregate([
      { $match: { ownerUid: req.user.uid, collaboration: { $in: items.map((item) => item._id) } } },
      { $group: { _id: '$collaboration', paidAt: { $max: '$paymentDate' } } },
    ]);
    const paidAtByCollaboration = new Map(paymentDates.map((item) => [String(item._id), item.paidAt]));
    data = data.map((item) => ({ ...item, paidAt: paidAtByCollaboration.get(String(item._id)) || null }));
  }
  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function createCollaboration(req, res) {
  const { deliverables = [], ...data } = req.body;
  const collaboration = await Collaboration.create({ ...data, ownerUid: req.user.uid });
  if (deliverables.length) await Deliverable.insertMany(deliverables.map((item) => ({ ...item, ownerUid: req.user.uid, collaboration: collaboration._id })));
  res.status(201).json({ data: decorate(collaboration) });
}

export async function getCollaboration(req, res) {
  assertId(req.params.id);
  const collaboration = await Collaboration.findOne({ _id: req.params.id, ownerUid: req.user.uid });
  if (!collaboration) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  const [deliverables, payments, invoices] = await Promise.all([
    Deliverable.find({ collaboration: collaboration._id, ownerUid: req.user.uid }).sort({ dueDate: 1 }),
    Payment.find({ collaboration: collaboration._id, ownerUid: req.user.uid }).sort({ paymentDate: -1 }),
    Invoice.find({ collaboration: collaboration._id, ownerUid: req.user.uid }).sort({ createdAt: -1 }),
  ]);
  res.json({ data: { ...decorate(collaboration), deliverables, payments, invoices } });
}

export async function updateCollaboration(req, res) {
  assertId(req.params.id);
  const existing = await Collaboration.findOne({ _id: req.params.id, ownerUid: req.user.uid });
  if (!existing) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  if (req.body.dealValuePaisa !== undefined && req.body.dealValuePaisa < existing.receivedPaisa) throw new AppError(400, 'Deal value cannot be lower than payments already recorded');
  const updates = { ...req.body };
  const nextDealValue = updates.dealValuePaisa ?? existing.dealValuePaisa;
  if (existing.receivedPaisa > 0 && existing.receivedPaisa >= nextDealValue) updates.status = 'Completed';
  const collaboration = await Collaboration.findOneAndUpdate({ _id: req.params.id, ownerUid: req.user.uid }, updates, { new: true, runValidators: true });
  res.json({ data: decorate(collaboration) });
}

export async function deleteCollaboration(req, res) {
  assertId(req.params.id);
  const collaboration = await Collaboration.findOneAndDelete({ _id: req.params.id, ownerUid: req.user.uid });
  if (!collaboration) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  await Promise.all([
    Deliverable.deleteMany({ collaboration: collaboration._id, ownerUid: req.user.uid }),
    Payment.deleteMany({ collaboration: collaboration._id, ownerUid: req.user.uid }),
    Invoice.updateMany({ collaboration: collaboration._id, ownerUid: req.user.uid }, { $set: { collaboration: null } }),
  ]);
  res.status(204).send();
}

export { assertId, decorate };
