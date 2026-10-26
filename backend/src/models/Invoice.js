import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  ratePaisa: { type: Number, required: true, min: 0 },
  amountPaisa: { type: Number, required: true, min: 0 },
}, { _id: false });

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  ownerUid: { type: String, required: true, index: true },
  collaboration: { type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration', default: null, index: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  from: { type: partySchema, required: true },
  billTo: { type: partySchema, required: true },
  lineItems: { type: [lineItemSchema], required: true },
  totalPaisa: { type: Number, required: true, min: 0 },
  paymentInstructions: { type: String, default: '' },
  notes: { type: String, default: '' },
  currency: { type: String, enum: ['INR'], default: 'INR' },
}, { timestamps: true });

invoiceSchema.index({ ownerUid: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ ownerUid: 1, createdAt: -1 });
export const Invoice = mongoose.model('Invoice', invoiceSchema);
