import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Collaboration } from '../models/Collaboration.js';
import { Invoice } from '../models/Invoice.js';
import { AppError } from '../utils/errors.js';
import { invoiceNumber } from '../utils/finance.js';
import { buildInvoicePdf } from '../services/invoicePdfService.js';

export async function listInvoices(req, res) {
  const items = await Invoice.find({ ownerUid: req.user.uid }).populate('collaboration', 'brandName campaignTitle').sort({ createdAt: -1 }).limit(100);
  res.json({ data: items });
}

export async function createInvoice(req, res) {
  let collaboration = null;
  if (req.body.collaborationId) {
    if (!mongoose.isValidObjectId(req.body.collaborationId)) throw new AppError(400, 'Invalid collaboration ID', 'INVALID_ID');
    collaboration = await Collaboration.findOne({ _id: req.body.collaborationId, ownerUid: req.user.uid });
    if (!collaboration) throw new AppError(404, 'Collaboration not found', 'NOT_FOUND');
  }
  const creator = await User.findOneAndUpdate({ uid: req.user.uid }, { $inc: { invoiceSequence: 1 } }, { new: true });
  if (!creator) throw new AppError(400, 'Complete your creator profile before creating an invoice');
  const lineItems = req.body.lineItems.map((item) => ({ ...item, amountPaisa: Math.round(item.quantity * item.ratePaisa) }));
  const totalPaisa = lineItems.reduce((sum, item) => sum + item.amountPaisa, 0);
  const invoice = await Invoice.create({
    ownerUid: req.user.uid, collaboration: collaboration?._id || null,
    invoiceNumber: invoiceNumber(creator.invoicePrefix, creator.invoiceSequence),
    invoiceDate: req.body.invoiceDate, dueDate: req.body.dueDate,
    from: req.body.from, billTo: req.body.billTo, lineItems, totalPaisa,
    paymentInstructions: req.body.paymentInstructions || '', notes: req.body.notes || '', currency: 'INR',
  });
  res.status(201).json({ data: invoice });
}

export async function getInvoice(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid invoice ID', 'INVALID_ID');
  const invoice = await Invoice.findOne({ _id: req.params.id, ownerUid: req.user.uid });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  res.json({ data: invoice });
}

export async function deleteInvoice(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid invoice ID', 'INVALID_ID');
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, ownerUid: req.user.uid });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  res.status(204).send();
}

export async function downloadInvoice(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid invoice ID', 'INVALID_ID');
  const invoice = await Invoice.findOne({ _id: req.params.id, ownerUid: req.user.uid });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  const pdf = await buildInvoicePdf(invoice);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.send(pdf);
}
