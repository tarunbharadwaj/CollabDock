import { z } from 'zod';

export const productTourSchema = z.object({
  status: z.enum(['Completed', 'Skipped']),
  version: z.number().int().min(1).max(100),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(['General', 'Bug', 'Confusing', 'Idea', 'Other']).default('General'),
  message: z.string().trim().max(2000).default(''),
  context: z.enum(['Collaboration Created', 'Payment Recorded', 'Invoice Created', 'Manual']),
  path: z.string().trim().startsWith('/').max(250),
  deviceClass: z.enum(['Desktop', 'Tablet', 'Mobile']),
});
