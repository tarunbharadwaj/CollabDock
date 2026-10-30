import { User } from '../models/User.js';
import { Feedback } from '../models/Feedback.js';
import { AppError } from '../utils/errors.js';

const FEEDBACK_LIMIT = 10;
const FEEDBACK_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function acknowledgeProductTour(req, res) {
  const acknowledgedAt = new Date();
  const user = await User.findOneAndUpdate(
    { uid: req.user.uid },
    {
      $set: {
        productTourStatus: req.body.status,
        productTourVersion: req.body.version,
        productTourAcknowledgedAt: acknowledgedAt,
      },
      $setOnInsert: { uid: req.user.uid, email: req.user.email },
    },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ data: user });
}

export async function recordFeedbackPrompt(req, res) {
  const lastFeedbackPromptAt = new Date();
  const user = await User.findOneAndUpdate(
    { uid: req.user.uid },
    { $set: { lastFeedbackPromptAt }, $setOnInsert: { uid: req.user.uid, email: req.user.email } },
    { new: true, upsert: true },
  );
  res.json({ data: { lastFeedbackPromptAt: user.lastFeedbackPromptAt } });
}

export async function createFeedback(req, res) {
  const windowStart = new Date(Date.now() - FEEDBACK_WINDOW_MS);
  const recentCount = await Feedback.countDocuments({ ownerUid: req.user.uid, createdAt: { $gte: windowStart } });
  if (recentCount >= FEEDBACK_LIMIT) throw new AppError(429, 'You have reached today\'s feedback limit. Please try again tomorrow.', 'FEEDBACK_LIMIT_REACHED');

  const creator = await User.findOne({ uid: req.user.uid }).select('displayName email');
  const feedback = await Feedback.create({
    ...req.body,
    ownerUid: req.user.uid,
    creatorName: creator?.displayName || req.user.name || '',
    creatorEmail: creator?.email || req.user.email || '',
  });
  await User.updateOne({ uid: req.user.uid }, { $set: { lastFeedbackPromptAt: new Date() } });
  res.status(201).json({ data: feedback });
}
