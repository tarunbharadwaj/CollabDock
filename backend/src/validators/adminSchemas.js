import { z } from 'zod';
import { collaborationSchema, invoiceSchema, paymentSchema } from './schemas.js';
import { DELIVERABLE_STATUSES } from '../utils/finance.js';

const reason = z.string().trim().min(10, 'Please provide a reason of at least 10 characters').max(500);
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(50).default(25);

export const adminUsersQuerySchema = z.object({
  page,
  limit,
  search: z.string().trim().max(100).optional(),
  status: z.enum(['Active', 'Suspended', 'Deletion Pending']).optional(),
  onboarding: z.enum(['complete', 'incomplete']).optional(),
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
});

export const adminResourceQuerySchema = z.object({ page, limit });

export const adminAuditQuerySchema = z.object({
  page,
  limit,
  action: z.string().trim().max(100).optional(),
  targetOwnerUid: z.string().trim().max(128).optional(),
});

export const adminFeedbackQuerySchema = z.object({
  page,
  limit,
  search: z.string().trim().max(100).optional(),
  status: z.enum(['New', 'Reviewed', 'Planned', 'Closed']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  category: z.enum(['General', 'Bug', 'Confusing', 'Idea', 'Other']).optional(),
  context: z.enum(['Collaboration Created', 'Payment Recorded', 'Invoice Created', 'Manual']).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  sort: z.enum(['newest', 'oldest', 'rating-high', 'rating-low']).default('newest'),
});

export const adminFeedbackUpdateSchema = z.object({
  status: z.enum(['New', 'Reviewed', 'Planned', 'Closed']).optional(),
  internalNote: z.string().trim().max(2000).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide a status or internal note');

export const adminProfileUpdateSchema = z.object({
  reason,
  changes: z.object({
    displayName: z.string().trim().min(2).max(80).optional(),
    instagramHandle: z.string().trim().max(40).optional(),
    niche: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    businessName: z.string().trim().max(120).optional(),
    businessAddress: z.string().trim().max(500).optional(),
    invoicePrefix: z.string().trim().min(2).max(8).regex(/^[A-Za-z0-9-]+$/).optional(),
    onboardingCompleted: z.boolean().optional(),
  }).refine((value) => Object.keys(value).length > 0, 'Provide at least one profile change'),
});

export const adminReasonSchema = z.object({ reason });
export const adminDeleteUserSchema = z.object({ reason, confirmationEmail: z.email() });

export const adminCollaborationUpdateSchema = z.object({
  reason,
  changes: collaborationSchema
    .omit({ deliverables: true })
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one collaboration change'),
});

export const adminDeliverableUpdateSchema = z.object({
  reason,
  changes: z.object({
    title: z.string().trim().min(2).max(160).optional(),
    contentType: z.enum(['Instagram Reel', 'Instagram Story', 'Carousel Post', 'Static Post', 'YouTube Video', 'Other']).optional(),
    dueDate: z.union([z.iso.datetime(), z.iso.date(), z.literal(''), z.null()]).optional(),
    status: z.enum(DELIVERABLE_STATUSES).optional(),
    notes: z.string().trim().max(1000).optional(),
  }).refine((value) => Object.keys(value).length > 0, 'Provide at least one deliverable change'),
});

export const adminPaymentCreateSchema = z.object({
  reason,
  collaborationId: z.string().trim().min(1),
  payment: paymentSchema,
});

export const adminPaymentUpdateSchema = z.object({
  reason,
  changes: paymentSchema.partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one payment change'),
});

export const adminInvoiceReplacementSchema = z.object({
  reason,
  invoice: invoiceSchema.omit({ collaborationId: true, paymentInstructions: true }),
});
