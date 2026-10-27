import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/firebase.js', () => ({ firebaseAuth: {} }));
vi.mock('../models/User.js', () => ({ User: {} }));
vi.mock('../models/Deliverable.js', () => ({ Deliverable: {} }));
vi.mock('../models/Invoice.js', () => ({ Invoice: {} }));
vi.mock('../models/AuditLog.js', () => ({ AuditLog: {} }));
vi.mock('../models/Collaboration.js', () => ({ Collaboration: { findById: vi.fn() } }));
vi.mock('../models/Payment.js', () => ({ Payment: { aggregate: vi.fn() } }));
vi.mock('../services/auditService.js', () => ({
  auditAdminAction: vi.fn(),
  safeAdminInvoice: vi.fn((value) => value),
  safeAdminPayment: vi.fn((value) => value),
  safeAdminUser: vi.fn((value) => value),
  scrubAdminData: vi.fn((value) => value),
}));

import { Collaboration } from '../models/Collaboration.js';
import { Payment } from '../models/Payment.js';
import { reconcileCollaboration } from './adminController.js';

function mockFinance({ dealValuePaisa = 10000, receivedPaisa = 0, status = 'In Progress', paymentTotal = 0 } = {}) {
  const collaboration = { _id: 'collaboration-id', dealValuePaisa, receivedPaisa, status, save: vi.fn() };
  Collaboration.findById.mockReturnValue({ session: vi.fn().mockResolvedValue(collaboration) });
  Payment.aggregate.mockReturnValue({ session: vi.fn().mockResolvedValue(paymentTotal ? [{ total: paymentTotal }] : []) });
  return collaboration;
}

describe('admin payment reconciliation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks a collaboration completed when corrected payments settle it', async () => {
    const collaboration = mockFinance({ paymentTotal: 10000 });
    await reconcileCollaboration('collaboration-id', {});
    expect(collaboration.receivedPaisa).toBe(10000);
    expect(collaboration.status).toBe('Completed');
    expect(collaboration.save).toHaveBeenCalled();
  });

  it('returns a completed collaboration to in progress after a payment is reduced', async () => {
    const collaboration = mockFinance({ status: 'Completed', paymentTotal: 6000 });
    await reconcileCollaboration('collaboration-id', {});
    expect(collaboration.receivedPaisa).toBe(6000);
    expect(collaboration.status).toBe('In Progress');
  });

  it('rejects corrected payments above the agreed value', async () => {
    mockFinance({ paymentTotal: 12000 });
    await expect(reconcileCollaboration('collaboration-id', {})).rejects.toMatchObject({ code: 'PAYMENT_EXCEEDS_BALANCE' });
  });
});
