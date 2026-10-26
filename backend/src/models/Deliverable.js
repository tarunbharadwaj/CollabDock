import mongoose from 'mongoose';
import { DELIVERABLE_STATUSES } from '../utils/finance.js';

const deliverableSchema = new mongoose.Schema({
  ownerUid: { type: String, required: true, index: true },
  collaboration: { type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration', required: true, index: true },
  title: { type: String, required: true, trim: true },
  contentType: { type: String, enum: ['Instagram Reel', 'Instagram Story', 'Carousel Post', 'Static Post', 'YouTube Video', 'Other'], default: 'Instagram Reel' },
  dueDate: Date,
  status: { type: String, enum: DELIVERABLE_STATUSES, default: 'Not Started' },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

deliverableSchema.index({ ownerUid: 1, dueDate: 1, status: 1 });
export const Deliverable = mongoose.model('Deliverable', deliverableSchema);
