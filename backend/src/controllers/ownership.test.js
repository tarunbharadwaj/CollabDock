import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Collaboration.js', () => ({ Collaboration: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('../models/Deliverable.js', () => ({ Deliverable: {} }));
vi.mock('../models/Payment.js', () => ({ Payment: { create: vi.fn() } }));
vi.mock('../models/Invoice.js', () => ({ Invoice: { findOneAndDelete: vi.fn() } }));

import { Collaboration } from '../models/Collaboration.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { getCollaboration } from './collaborationController.js';
import { deleteInvoice } from './invoiceController.js';
import { recordPayment } from '../services/paymentService.js';

const resourceId = '507f1f77bcf86cd799439011';

describe('ownership boundaries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('looks up collaboration details with the verified owner UID', async () => {
    Collaboration.findOne.mockResolvedValue(null);
    await expect(getCollaboration({ params: { id: resourceId }, user: { uid: 'verified-owner' } }, {})).rejects.toMatchObject({ status: 404 });
    expect(Collaboration.findOne).toHaveBeenCalledWith({ _id: resourceId, ownerUid: 'verified-owner' });
  });

  it('deletes invoices only when they belong to the verified owner', async () => {
    Invoice.findOneAndDelete.mockResolvedValue({ _id: resourceId });
    const response = { status: vi.fn().mockReturnThis(), send: vi.fn() };

    await deleteInvoice({ params: { id: resourceId }, user: { uid: 'verified-owner' } }, response);

    expect(Invoice.findOneAndDelete).toHaveBeenCalledWith({ _id: resourceId, ownerUid: 'verified-owner', status: { $ne: 'Void' } });
    expect(response.status).toHaveBeenCalledWith(204);
  });

  it('bounds atomic payments by owner and remaining deal value', async () => {
    Collaboration.findOneAndUpdate.mockResolvedValue(null);
    await expect(recordPayment('verified-owner', resourceId, { amountPaisa: 5000, paymentDate: '2026-10-10' })).rejects.toMatchObject({ code: 'PAYMENT_EXCEEDS_BALANCE' });
    const filter = Collaboration.findOneAndUpdate.mock.calls[0][0];
    expect(filter.ownerUid).toBe('verified-owner');
    expect(filter.$expr).toBeDefined();
  });

  it('marks the collaboration completed when the payment settles the deal', async () => {
    Collaboration.findOneAndUpdate.mockResolvedValueOnce({ status: 'In Progress', receivedPaisa: 5000, dealValuePaisa: 10000 });
    Payment.create.mockResolvedValue({ amountPaisa: 5000 });

    await recordPayment('verified-owner', resourceId, { amountPaisa: 5000, paymentDate: '2026-10-10' });

    const [, update] = Collaboration.findOneAndUpdate.mock.calls[0];
    expect(update[0].$set.status.$cond[1]).toBe('Completed');
    expect(Collaboration.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('keeps the collaboration status unchanged for a partial payment', async () => {
    Collaboration.findOneAndUpdate.mockResolvedValueOnce({ status: 'In Progress', receivedPaisa: 2000, dealValuePaisa: 10000 });
    Payment.create.mockResolvedValue({ amountPaisa: 2000 });

    await recordPayment('verified-owner', resourceId, { amountPaisa: 2000, paymentDate: '2026-10-10' });

    const [, update] = Collaboration.findOneAndUpdate.mock.calls[0];
    expect(update[0].$set.status.$cond[2]).toBe('$status');
    expect(update[0].$set.receivedPaisa).toEqual({ $add: ['$receivedPaisa', 2000] });
  });
});
