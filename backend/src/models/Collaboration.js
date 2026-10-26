import mongoose from 'mongoose';
import { COLLABORATION_STATUSES } from '../utils/finance.js';

const collaborationSchema = new mongoose.Schema({
  ownerUid: { type: String, required: true, index: true },
  brandName: { type: String, required: true, trim: true },
  campaignTitle: { type: String, trim: true, default: '' },
  brandContactName: { type: String, trim: true, default: '' },
  brandEmail: { type: String, trim: true, default: '' },
  brandPhone: { type: String, trim: true, default: '' },
  brandAddress: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  platform: { type: String, enum: ['Instagram', 'YouTube', 'Other'], default: 'Instagram' },
  dealValuePaisa: { type: Number, required: true, min: 0 },
  receivedPaisa: { type: Number, default: 0, min: 0 },
  startDate: Date,
  deadline: Date,
  paymentDueDate: Date,
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: COLLABORATION_STATUSES, default: 'Lead' },
}, { timestamps: true });

collaborationSchema.index({ ownerUid: 1, status: 1, deadline: 1 });
collaborationSchema.index({ ownerUid: 1, updatedAt: -1 });
collaborationSchema.index({ ownerUid: 1, dealValuePaisa: 1, receivedPaisa: 1 });
collaborationSchema.index({ ownerUid: 1, brandName: 'text', campaignTitle: 'text' });
export const Collaboration = mongoose.model('Collaboration', collaborationSchema);
