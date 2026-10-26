import mongoose from 'mongoose';
import { Collaboration } from '../models/Collaboration.js';
import { Payment } from '../models/Payment.js';
import { paymentStatus } from '../utils/finance.js';
import { recordPayment, removePayment } from '../services/paymentService.js';
import { assertId } from './collaborationController.js';

export async function listPayments(req, res) {
  const collaborations = await Collaboration.find({ ownerUid: req.user.uid, status: { $ne: 'Cancelled' } }).sort({ paymentDueDate: 1 });
  const rows = collaborations.map((item) => ({
    ...item.toObject(), outstandingPaisa: Math.max(0, item.dealValuePaisa - item.receivedPaisa), paymentStatus: paymentStatus(item),
  }));
  const summary = rows.reduce((acc, item) => {
    acc.receivedPaisa += item.receivedPaisa;
    acc.outstandingPaisa += item.outstandingPaisa;
    if (item.paymentStatus === 'Overdue') acc.overduePaisa += item.outstandingPaisa;
    return acc;
  }, { receivedPaisa: 0, outstandingPaisa: 0, overduePaisa: 0 });
  res.json({ data: rows, summary });
}

export async function createPayment(req, res) {
  assertId(req.params.id);
  const result = await recordPayment(req.user.uid, req.params.id, req.body);
  res.status(201).json({ data: result.payment });
}

export async function deletePayment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid resource ID' } });
  await removePayment(req.user.uid, req.params.id);
  res.status(204).send();
}

export async function paymentHistory(req, res) {
  const items = await Payment.find({ ownerUid: req.user.uid }).populate('collaboration', 'brandName campaignTitle').sort({ paymentDate: -1 }).limit(100);
  res.json({ data: items });
}
