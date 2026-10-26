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
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
