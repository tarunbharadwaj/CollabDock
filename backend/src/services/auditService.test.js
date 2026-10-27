import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { safeAdminInvoice, safeAdminPayment, safeAdminUser, scrubAdminData } from './auditService.js';

describe('admin privacy projections', () => {
  it('recursively removes sensitive payment and banking fields', () => {
    const result = scrubAdminData({
      displayName: 'Creator',
      bankDetails: 'private bank data',
      upiId: 'creator@upi',
      invoice: { paymentInstructions: 'account details' },
      payments: [{ referenceId: 'private-reference', amountPaisa: 5000 }],
    });
    expect(result).toEqual({ displayName: 'Creator', invoice: {}, payments: [{ amountPaisa: 5000 }] });
  });

  it('omits internal invoice sequence and sensitive resource fields', () => {
    expect(safeAdminUser({ uid: 'one', invoiceSequence: 42, bankDetails: 'secret' })).toEqual({ uid: 'one' });
    expect(safeAdminInvoice({ invoiceNumber: 'INV-1', paymentInstructions: 'secret' })).toEqual({ invoiceNumber: 'INV-1' });
    expect(safeAdminPayment({ amountPaisa: 100, referenceId: 'secret' })).toEqual({ amountPaisa: 100 });
  });

  it('serializes database IDs without exposing driver internals', () => {
    const id = new mongoose.Types.ObjectId();
    expect(scrubAdminData({ _id: id })).toEqual({ _id: String(id) });
  });
});
