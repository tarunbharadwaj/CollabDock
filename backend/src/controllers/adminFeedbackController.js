import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { AppError } from '../utils/errors.js';
import { auditAdminAction, scrubAdminData } from '../services/auditService.js';

function pageMeta(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listAdminFeedback(req, res) {
  const { page, limit, search, status, rating, category, context, from, to, sort } = req.validatedQuery;
  const query = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ creatorName: pattern }, { creatorEmail: pattern }, { message: pattern }];
  }
  if (status) query.status = status;
  if (rating) query.rating = rating;
  if (category) query.category = category;
  if (context) query.context = context;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) query.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  const sortValue = sort === 'oldest' ? { createdAt: 1 } : sort === 'rating-high' ? { rating: -1, createdAt: -1 } : sort === 'rating-low' ? { rating: 1, createdAt: -1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Feedback.find(query).sort(sortValue).skip((page - 1) * limit).limit(limit),
    Feedback.countDocuments(query),
  ]);
  res.json({ data: items.map(scrubAdminData), meta: pageMeta(page, limit, total) });
}

export async function updateAdminFeedback(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid feedback ID', 'INVALID_ID');
  const existing = await Feedback.findById(req.params.id);
  if (!existing) throw new AppError(404, 'Feedback not found', 'NOT_FOUND');
  const changes = {
    ...req.body,
    reviewedByUid: req.user.uid,
    reviewedAt: new Date(),
  };
  const updated = await Feedback.findByIdAndUpdate(req.params.id, { $set: changes }, { new: true, runValidators: true });
  await auditAdminAction(req, {
    action: 'feedback.reviewed',
    targetType: 'Feedback',
    targetId: String(existing._id),
    targetOwnerUid: existing.ownerUid,
    reason: `Feedback marked ${updated.status}`,
    before: { status: existing.status, internalNote: existing.internalNote },
    after: { status: updated.status, internalNote: updated.internalNote },
  });
  res.json({ data: scrubAdminData(updated) });
}
