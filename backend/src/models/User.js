import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  displayName: { type: String, trim: true, default: '' },
  instagramHandle: { type: String, trim: true, default: '' },
  niche: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  businessName: { type: String, trim: true, default: '' },
  businessAddress: { type: String, trim: true, default: '' },
  upiId: { type: String, trim: true, default: '' },
  bankDetails: { type: String, trim: true, default: '' },
  invoicePrefix: { type: String, trim: true, default: 'INV', maxlength: 8 },
  invoiceSequence: { type: Number, default: 0 },
  onboardingCompleted: { type: Boolean, default: false },
  accountStatus: { type: String, enum: ['Active', 'Suspended', 'Deletion Pending'], default: 'Active', index: true },
  suspendedAt: { type: Date, default: null },
  suspendedByUid: { type: String, default: '' },
  suspensionReason: { type: String, default: '' },
  productTourStatus: { type: String, enum: ['Not Seen', 'Completed', 'Skipped'], default: 'Not Seen' },
  productTourVersion: { type: Number, default: 0, min: 0 },
  productTourAcknowledgedAt: { type: Date, default: null },
  lastFeedbackPromptAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.index({ displayName: 'text', email: 'text', instagramHandle: 'text' });
userSchema.index({ accountStatus: 1, createdAt: -1 });
userSchema.index({ onboardingCompleted: 1, createdAt: -1 });

export const User = mongoose.model('User', userSchema);
