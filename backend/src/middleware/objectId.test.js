import { describe, expect, it, vi } from 'vitest';
import { validateObjectIdParam } from './objectId.js';

describe('resource ID validation', () => {
  it('rejects malformed MongoDB IDs before a controller runs', () => {
    const next = vi.fn();
    validateObjectIdParam({}, {}, next, 'not-an-object-id');
    expect(next.mock.calls[0][0]).toMatchObject({ status: 400, code: 'INVALID_ID' });
  });

  it('accepts canonical MongoDB IDs', () => {
    const next = vi.fn();
    validateObjectIdParam({}, {}, next, '507f1f77bcf86cd799439011');
    expect(next).toHaveBeenCalledWith();
  });
});
