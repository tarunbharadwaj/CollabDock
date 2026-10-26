import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  ownerUid: { type: String, required: true, index: true },
  collaboration: { type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration', required: true, index: true },
  amountPaisa: { type: Number, required: true, min: 1 },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other'], default: 'Bank Transfer' },
  referenceId: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

paymentSchema.index({ ownerUid: 1, paymentDate: -1 });
export const Payment = mongoose.model('Payment', paymentSchema);
