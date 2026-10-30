import { describe, expect, it } from 'vitest';
import { adminDeleteUserSchema, adminProfileUpdateSchema, adminUsersQuerySchema } from './adminSchemas.js';

describe('admin request validation', () => {
  it('coerces pagination and applies safe defaults', () => {
    expect(adminUsersQuerySchema.parse({})).toMatchObject({ page: 1, limit: 25, sort: 'newest' });
    expect(adminUsersQuerySchema.parse({ page: '2', limit: '50' })).toMatchObject({ page: 2, limit: 50 });
    expect(adminUsersQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it('requires a meaningful reason and matching-shaped deletion confirmation', () => {
    expect(adminDeleteUserSchema.safeParse({ reason: 'too short', confirmationEmail: 'creator@example.com' }).success).toBe(false);
    expect(adminDeleteUserSchema.safeParse({ reason: 'Requested by account owner', confirmationEmail: 'creator@example.com' }).success).toBe(true);
  });

  it('does not accept banking fields in profile changes', () => {
    const result = adminProfileUpdateSchema.safeParse({ reason: 'Support correction requested', changes: { bankDetails: 'private' } });
    expect(result.success).toBe(false);
  });
});
