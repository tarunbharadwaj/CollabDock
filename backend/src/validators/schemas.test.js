import { describe, expect, it } from 'vitest';
import { collaborationSchema, paymentSchema } from './schemas.js';

describe('API validation', () => {
  const deliverables = [{ title: 'Launch Reel', contentType: 'Instagram Reel', dueDate: '2026-10-30' }];

  it('accepts a collaboration with a completed deliverable', () => expect(collaborationSchema.safeParse({ brandName: 'Nykaa', dealValuePaisa: 1500000, deliverables }).success).toBe(true));
  it('requires at least one deliverable', () => expect(collaborationSchema.safeParse({ brandName: 'Nykaa', dealValuePaisa: 1500000 }).success).toBe(false));
  it('requires the deliverable due date', () => expect(collaborationSchema.safeParse({ brandName: 'Nykaa', dealValuePaisa: 1500000, deliverables: [{ title: 'Launch Reel', contentType: 'Instagram Reel' }] }).success).toBe(false));
  it('rejects negative deal values', () => expect(collaborationSchema.safeParse({ brandName: 'Nykaa', dealValuePaisa: -1, deliverables }).success).toBe(false));
  it('requires positive integer paise payments', () => {
    expect(paymentSchema.safeParse({ amountPaisa: 100, paymentDate: '2026-10-10' }).success).toBe(true);
    expect(paymentSchema.safeParse({ amountPaisa: 1.2, paymentDate: '2026-10-10' }).success).toBe(false);
  });
});
