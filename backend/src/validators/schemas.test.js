import { describe, expect, it } from 'vitest';
import { profileSchema } from './schemas.js';

describe('profile onboarding validation', () => {
  it('allows ordinary partial profile updates', () => {
    expect(profileSchema.safeParse({ displayName: 'Tarun' }).success).toBe(true);
  });

  it('rejects onboarding completion when required workspace details are missing', () => {
    const result = profileSchema.safeParse({
      displayName: 'Tarun',
      onboardingCompleted: true,
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining([
      'instagramHandle',
      'niche',
      'phone',
      'businessName',
    ]));
  });

  it('accepts onboarding completion with the required workspace details', () => {
    const result = profileSchema.safeParse({
      displayName: 'Tarun Bharadwaj',
      instagramHandle: 'imtarun_13',
      niche: 'Technology',
      phone: '+91 98765 43210',
      businessName: 'Tarun Studio',
      currency: 'INR',
      onboardingCompleted: true,
    });

    expect(result.success).toBe(true);
  });
});
