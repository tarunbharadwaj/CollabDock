import { describe, expect, it } from 'vitest';
import { adminFeedbackQuerySchema, adminFeedbackUpdateSchema } from './adminSchemas.js';
import { feedbackSchema, productTourSchema } from './feedbackSchemas.js';

describe('product experience validation', () => {
  it('accepts only completed or skipped tour acknowledgements', () => {
    expect(productTourSchema.safeParse({ status: 'Completed', version: 1 }).success).toBe(true);
    expect(productTourSchema.safeParse({ status: 'Skipped', version: 1 }).success).toBe(true);
    expect(productTourSchema.safeParse({ status: 'Not Seen', version: 1 }).success).toBe(false);
  });

  it('validates feedback and strips unapproved sensitive fields', () => {
    const result = feedbackSchema.parse({
      rating: 5,
      category: 'Idea',
      message: 'A faster invoice flow would help.',
      context: 'Invoice Created',
      path: '/app/invoices',
      deviceClass: 'Desktop',
      bankDetails: 'private',
      token: 'secret',
      referenceId: 'transaction',
    });
    expect(result).not.toHaveProperty('bankDetails');
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('referenceId');
  });

  it('rejects invalid ratings, external paths, and oversized comments', () => {
    const base = { category: 'General', message: '', context: 'Manual', path: '/app/settings', deviceClass: 'Mobile' };
    expect(feedbackSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...base, rating: 4, path: 'https://example.com' }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...base, rating: 4, message: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('coerces safe admin filters and requires a review change', () => {
    expect(adminFeedbackQuerySchema.parse({ rating: '4' })).toMatchObject({ page: 1, limit: 25, rating: 4, sort: 'newest' });
    expect(adminFeedbackQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
    expect(adminFeedbackUpdateSchema.safeParse({}).success).toBe(false);
    expect(adminFeedbackUpdateSchema.safeParse({ status: 'Reviewed', internalNote: 'Useful report' }).success).toBe(true);
  });
});
