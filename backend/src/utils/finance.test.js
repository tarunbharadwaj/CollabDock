import { describe, expect, it } from 'vitest';
import { calculateOutstanding, isActiveCollaboration, isCompletedCollaboration, paymentStatus, invoiceNumber } from './finance.js';

describe('financial calculations', () => {
  it('uses integer paise for partial balances', () => expect(calculateOutstanding(1_500_000, 500_000)).toBe(1_000_000));
  it('never returns a negative balance', () => expect(calculateOutstanding(100, 200)).toBe(0));
  it('marks a fully settled deal paid', () => expect(paymentStatus({ dealValuePaisa: 10000, receivedPaisa: 10000 })).toBe('Paid'));
  it('marks a past-due balance overdue', () => expect(paymentStatus({ dealValuePaisa: 10000, receivedPaisa: 2000, paymentDueDate: '2025-01-01', now: new Date('2025-01-02') })).toBe('Overdue'));
  it('marks a future partial balance partially paid', () => expect(paymentStatus({ dealValuePaisa: 10000, receivedPaisa: 2000, paymentDueDate: '2025-02-01', now: new Date('2025-01-02') })).toBe('Partially Paid'));
  it('does not count a fully paid legacy deal as active', () => expect(isActiveCollaboration({ status: 'In Progress', dealValuePaisa: 10000, receivedPaisa: 10000 })).toBe(false));
  it('counts an outstanding in-progress deal as active', () => expect(isActiveCollaboration({ status: 'In Progress', dealValuePaisa: 10000, receivedPaisa: 4000 })).toBe(true));
  it('counts a fully paid deal as completed', () => expect(isCompletedCollaboration({ status: 'In Progress', dealValuePaisa: 10000, receivedPaisa: 10000 })).toBe(true));
  it('does not count a cancelled paid deal as completed', () => expect(isCompletedCollaboration({ status: 'Cancelled', dealValuePaisa: 10000, receivedPaisa: 10000 })).toBe(false));
});

describe('invoice numbering', () => {
  it('is stable, prefixed, and zero padded', () => expect(invoiceNumber('cd', 42, new Date('2026-06-01'))).toBe('CD-2026-0042'));
});
