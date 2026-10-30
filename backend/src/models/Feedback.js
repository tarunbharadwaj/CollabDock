import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  ownerUid: { type: String, required: true, index: true },
  creatorName: { type: String, trim: true, default: '' },
  creatorEmail: { type: String, trim: true, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5, index: true },
  category: { type: String, enum: ['General', 'Bug', 'Confusing', 'Idea', 'Other'], default: 'General', index: true },
  message: { type: String, trim: true, maxlength: 2000, default: '' },
  context: { type: String, enum: ['Collaboration Created', 'Payment Recorded', 'Invoice Created', 'Manual'], required: true, index: true },
  path: { type: String, trim: true, maxlength: 250, required: true },
  deviceClass: { type: String, enum: ['Desktop', 'Tablet', 'Mobile'], required: true },
  status: { type: String, enum: ['New', 'Reviewed', 'Planned', 'Closed'], default: 'New', index: true },
  internalNote: { type: String, trim: true, maxlength: 2000, default: '' },
  reviewedByUid: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ ownerUid: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, context: 1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
