import { z } from 'zod';
import { COLLABORATION_STATUSES, DELIVERABLE_STATUSES } from '../utils/finance.js';

const optionalText = (max = 1000) => z.string().trim().max(max).optional();
const dateField = z.union([z.iso.datetime(), z.iso.date(), z.literal(''), z.null()]).optional();
const requiredDateField = z.union([z.iso.datetime(), z.iso.date()]);

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  instagramHandle: z.string().trim().max(40).optional().default(''),
  niche: optionalText(80), phone: optionalText(30),
  currency: z.literal('INR').default('INR'),
  businessName: optionalText(120), businessAddress: optionalText(500),
  upiId: optionalText(100), bankDetails: optionalText(500),
  invoicePrefix: z.string().trim().min(2).max(8).regex(/^[A-Za-z0-9-]+$/).optional(),
  onboardingCompleted: z.boolean().optional(),
}).partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');

export const collaborationSchema = z.object({
  brandName: z.string().trim().min(2).max(120),
  campaignTitle: optionalText(160), brandContactName: optionalText(100),
  brandEmail: z.union([z.email(), z.literal('')]).optional(), brandPhone: optionalText(30), brandAddress: optionalText(500),
  description: optionalText(2000), platform: z.enum(['Instagram', 'YouTube', 'Other']).optional(),
  dealValuePaisa: z.number().int().nonnegative(), startDate: dateField, deadline: dateField, paymentDueDate: dateField,
  notes: optionalText(3000), status: z.enum(COLLABORATION_STATUSES).optional(),
  deliverables: z.array(z.object({
    title: z.string().trim().min(2).max(160),
    contentType: z.enum(['Instagram Reel', 'Instagram Story', 'Carousel Post', 'Static Post', 'YouTube Video', 'Other']),
    dueDate: requiredDateField,
  })).min(1).max(10),
});
export const collaborationUpdateSchema = collaborationSchema.partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');

export const deliverableSchema = z.object({
  title: z.string().trim().min(2).max(160),
  contentType: z.enum(['Instagram Reel', 'Instagram Story', 'Carousel Post', 'Static Post', 'YouTube Video', 'Other']).optional(),
  dueDate: dateField, status: z.enum(DELIVERABLE_STATUSES).optional(), notes: optionalText(1000),
});
export const deliverableUpdateSchema = deliverableSchema.partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field');

export const paymentSchema = z.object({
  amountPaisa: z.number().int().positive(), paymentDate: z.union([z.iso.datetime(), z.iso.date()]),
  paymentMethod: z.enum(['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other']).optional(),
  referenceId: optionalText(100), notes: optionalText(1000),
});

const party = z.object({ name: z.string().trim().min(2).max(160), email: z.union([z.email(), z.literal('')]).optional(), address: optionalText(500), phone: optionalText(30) });
export const invoiceSchema = z.object({
  collaborationId: z.string().optional().nullable(), invoiceDate: z.union([z.iso.datetime(), z.iso.date()]), dueDate: z.union([z.iso.datetime(), z.iso.date()]),
  from: party, billTo: party,
  lineItems: z.array(z.object({ description: z.string().trim().min(2).max(500), quantity: z.number().positive(), ratePaisa: z.number().int().nonnegative() })).min(1).max(20),
  paymentInstructions: optionalText(1000), notes: optionalText(1000),
});
