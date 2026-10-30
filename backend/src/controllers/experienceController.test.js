import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/User.js', () => ({ User: { findOneAndUpdate: vi.fn(), findOne: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../models/Feedback.js', () => ({ Feedback: { countDocuments: vi.fn(), create: vi.fn() } }));

import { User } from '../models/User.js';
import { Feedback } from '../models/Feedback.js';
import { acknowledgeProductTour, createFeedback, recordFeedbackPrompt } from './experienceController.js';

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

describe('product experience controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses a server timestamp when acknowledging the product tour', async () => {
    const updated = { productTourStatus: 'Completed', productTourVersion: 1 };
    User.findOneAndUpdate.mockResolvedValue(updated);
    const req = { user: { uid: 'creator', email: 'creator@example.com' }, body: { status: 'Completed', version: 1 } };
    const res = response();
    await acknowledgeProductTour(req, res);
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { uid: 'creator' },
      expect.objectContaining({ $set: expect.objectContaining({ productTourAcknowledgedAt: expect.any(Date) }) }),
      expect.objectContaining({ upsert: true }),
    );
    expect(res.json).toHaveBeenCalledWith({ data: updated });
  });

  it('records feedback prompt cooldown using server time', async () => {
    const lastFeedbackPromptAt = new Date();
    User.findOneAndUpdate.mockResolvedValue({ lastFeedbackPromptAt });
    const res = response();
    await recordFeedbackPrompt({ user: { uid: 'creator', email: 'creator@example.com' } }, res);
    expect(res.json).toHaveBeenCalledWith({ data: { lastFeedbackPromptAt } });
  });

  it('links accepted feedback to the verified creator identity', async () => {
    Feedback.countDocuments.mockResolvedValue(0);
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ displayName: 'Aanya', email: 'aanya@example.com' }) });
    Feedback.create.mockImplementation(async (value) => ({ _id: 'feedback-id', ...value }));
    User.updateOne.mockResolvedValue({ acknowledged: true });
    const body = { rating: 5, category: 'General', message: 'Very clear', context: 'Manual', path: '/app/settings', deviceClass: 'Mobile' };
    const res = response();
    await createFeedback({ user: { uid: 'verified-uid', email: 'token@example.com' }, body }, res);
    expect(Feedback.create).toHaveBeenCalledWith(expect.objectContaining({ ownerUid: 'verified-uid', creatorName: 'Aanya', creatorEmail: 'aanya@example.com' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects more than ten submissions in a rolling day', async () => {
    Feedback.countDocuments.mockResolvedValue(10);
    await expect(createFeedback({ user: { uid: 'creator' }, body: {} }, response())).rejects.toMatchObject({ status: 429, code: 'FEEDBACK_LIMIT_REACHED' });
    expect(Feedback.create).not.toHaveBeenCalled();
  });
});
