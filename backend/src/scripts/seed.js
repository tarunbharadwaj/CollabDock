import { connectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Collaboration } from '../models/Collaboration.js';
import { Deliverable } from '../models/Deliverable.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';

if (env.NODE_ENV === 'production') throw new Error('Seed data is disabled in production');
const uid = process.env.DEV_FIREBASE_UID;
if (!uid) throw new Error('Set DEV_FIREBASE_UID to the UID of a Firebase Emulator/local development user');
const day = 86_400_000; const date = (offset) => new Date(Date.now() + offset * day);

await connectDatabase();
if (await Collaboration.exists({ ownerUid: uid })) {
  console.log('Seed skipped: this development user already has collaboration data.');
  process.exit(0);
}
const user = await User.findOneAndUpdate({ uid }, { $set: {
  email: process.env.DEV_FIREBASE_EMAIL || 'creator@example.com', displayName: 'Aanya Kapoor', instagramHandle: 'aanyacreates', niche: 'Lifestyle', currency: 'INR', businessName: 'Aanya Kapoor Studio', businessAddress: 'Mumbai, Maharashtra, India', phone: '+91 98765 43210', upiId: 'aanya@upi', bankDetails: 'Account name: Aanya Kapoor\nBank: Example Bank\nIFSC: EXAM0001234', invoicePrefix: 'AK', onboardingCompleted: true,
} }, { new: true, upsert: true });

const collaborations = await Collaboration.insertMany([
  { ownerUid: uid, brandName: 'Glow & Co.', campaignTitle: 'Diwali Reels Campaign', brandContactName: 'Priya', brandEmail: 'priya@example.com', brandPhone: '+91 90000 00001', platform: 'Instagram', dealValuePaisa: 2500000, receivedPaisa: 0, startDate: date(-7), deadline: date(4), paymentDueDate: date(19), status: 'In Progress' },
  { ownerUid: uid, brandName: 'Minimalist', campaignTitle: 'Skincare Launch', brandContactName: 'Kabir', brandPhone: '+91 90000 00002', platform: 'Instagram', dealValuePaisa: 1850000, receivedPaisa: 500000, startDate: date(-15), deadline: date(2), paymentDueDate: date(-3), status: 'Content Submitted' },
  { ownerUid: uid, brandName: 'Noise', campaignTitle: 'Smartwatch Stories', platform: 'Instagram', dealValuePaisa: 1500000, receivedPaisa: 1500000, startDate: date(-30), deadline: date(-12), paymentDueDate: date(-5), status: 'Completed' },
  { ownerUid: uid, brandName: 'The Whole Truth', campaignTitle: 'Protein Bar Carousel', brandContactName: 'Meera', platform: 'Instagram', dealValuePaisa: 1000000, receivedPaisa: 0, startDate: date(-2), deadline: date(9), paymentDueDate: date(30), status: 'Confirmed' },
]);
await Deliverable.insertMany([
  { ownerUid: uid, collaboration: collaborations[0]._id, title: 'Festive morning routine Reel', contentType: 'Instagram Reel', dueDate: date(4), status: 'In Progress' },
  { ownerUid: uid, collaboration: collaborations[0]._id, title: 'Product link Stories', contentType: 'Instagram Story', dueDate: date(5), status: 'Not Started' },
  { ownerUid: uid, collaboration: collaborations[1]._id, title: 'Launch Reel', contentType: 'Instagram Reel', dueDate: date(2), status: 'Submitted' },
  { ownerUid: uid, collaboration: collaborations[3]._id, title: '5-slide ingredient carousel', contentType: 'Carousel Post', dueDate: date(9), status: 'Not Started' },
]);
await Payment.insertMany([
  { ownerUid: uid, collaboration: collaborations[1]._id, amountPaisa: 500000, paymentDate: date(-8), paymentMethod: 'UPI', referenceId: 'SEED-PARTIAL' },
  { ownerUid: uid, collaboration: collaborations[2]._id, amountPaisa: 1500000, paymentDate: date(-7), paymentMethod: 'Bank Transfer', referenceId: 'SEED-PAID' },
]);
await Invoice.create({ ownerUid: uid, collaboration: collaborations[2]._id, invoiceNumber: 'AK-2026-0001', invoiceDate: date(-20), dueDate: date(-5), from: { name: user.businessName, email: user.email, address: user.businessAddress, phone: user.phone }, billTo: { name: 'Noise', email: 'accounts@example.com' }, lineItems: [{ description: 'Smartwatch Instagram Stories', quantity: 1, ratePaisa: 1500000, amountPaisa: 1500000 }], totalPaisa: 1500000, paymentInstructions: `UPI: ${user.upiId}`, notes: 'Thank you for the collaboration.' });
user.invoiceSequence = 1; await user.save();
console.log(`Seeded CollabDock demo data for development UID: ${uid}`);
process.exit(0);
