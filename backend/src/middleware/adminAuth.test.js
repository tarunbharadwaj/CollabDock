import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/firebase.js', () => ({ firebaseAuth: { verifyIdToken: vi.fn() } }));
vi.mock('../models/User.js', () => ({ User: { findOne: vi.fn() } }));

import { firebaseAuth } from '../config/firebase.js';
import { User } from '../models/User.js';
import { requireActiveAccount, requireAdmin, requireAuth } from './auth.js';

describe('admin authentication boundaries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('copies only the verified Firebase admin claim into the request identity', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin-uid', email: 'admin@example.com', admin: true });
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const next = vi.fn();
    await requireAuth(req, {}, next);
    expect(req.user).toEqual({ uid: 'admin-uid', email: 'admin@example.com', name: '', admin: true });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects authenticated users without the admin claim', () => {
    const next = vi.fn();
    requireAdmin({ user: { uid: 'creator-uid', admin: false } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403, code: 'ADMIN_REQUIRED' });
  });

  it('allows verified administrators', () => {
    const next = vi.fn();
    requireAdmin({ user: { uid: 'admin-uid', admin: true } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks suspended creator accounts from creator endpoints', async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ accountStatus: 'Suspended' }) });
    const next = vi.fn();
    await requireActiveAccount({ user: { uid: 'suspended-uid' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403, code: 'ACCOUNT_SUSPENDED' });
  });
});
