import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/errors.js';
import {
  adminMe,
  adminOverview,
  listAdminUsers,
  getAdminUser,
  updateAdminUser,
  suspendAdminUser,
  reactivateAdminUser,
  deleteAdminUser,
  listAdminCollaborations,
  listAdminPayments,
  listAdminInvoices,
  getAdminCollaboration,
  updateAdminCollaboration,
  deleteAdminCollaboration,
  updateAdminDeliverable,
  deleteAdminDeliverable,
  createAdminPayment,
  updateAdminPayment,
  deleteAdminPayment,
  voidAndRecreateAdminInvoice,
  listAdminAuditLogs,
} from '../controllers/adminController.js';
import {
  adminUsersQuerySchema,
  adminResourceQuerySchema,
  adminAuditQuerySchema,
  adminProfileUpdateSchema,
  adminReasonSchema,
  adminDeleteUserSchema,
  adminCollaborationUpdateSchema,
  adminDeliverableUpdateSchema,
  adminPaymentCreateSchema,
  adminPaymentUpdateSchema,
  adminInvoiceReplacementSchema,
} from '../validators/adminSchemas.js';

export const adminRouter = Router();

adminRouter.get('/me', adminMe);
adminRouter.get('/overview', asyncHandler(adminOverview));
adminRouter.get('/users', validate(adminUsersQuerySchema, 'query'), asyncHandler(listAdminUsers));
adminRouter.get('/users/:uid', asyncHandler(getAdminUser));
adminRouter.patch('/users/:uid', validate(adminProfileUpdateSchema), asyncHandler(updateAdminUser));
adminRouter.post('/users/:uid/suspend', validate(adminReasonSchema), asyncHandler(suspendAdminUser));
adminRouter.post('/users/:uid/reactivate', validate(adminReasonSchema), asyncHandler(reactivateAdminUser));
adminRouter.delete('/users/:uid', validate(adminDeleteUserSchema), asyncHandler(deleteAdminUser));
adminRouter.get('/users/:uid/collaborations', validate(adminResourceQuerySchema, 'query'), asyncHandler(listAdminCollaborations));
adminRouter.get('/users/:uid/payments', validate(adminResourceQuerySchema, 'query'), asyncHandler(listAdminPayments));
adminRouter.get('/users/:uid/invoices', validate(adminResourceQuerySchema, 'query'), asyncHandler(listAdminInvoices));
adminRouter.post('/users/:uid/payments', validate(adminPaymentCreateSchema), asyncHandler(createAdminPayment));
adminRouter.get('/collaborations/:id', asyncHandler(getAdminCollaboration));
adminRouter.patch('/collaborations/:id', validate(adminCollaborationUpdateSchema), asyncHandler(updateAdminCollaboration));
adminRouter.delete('/collaborations/:id', validate(adminReasonSchema), asyncHandler(deleteAdminCollaboration));
adminRouter.patch('/deliverables/:id', validate(adminDeliverableUpdateSchema), asyncHandler(updateAdminDeliverable));
adminRouter.delete('/deliverables/:id', validate(adminReasonSchema), asyncHandler(deleteAdminDeliverable));
adminRouter.patch('/payments/:id', validate(adminPaymentUpdateSchema), asyncHandler(updateAdminPayment));
adminRouter.delete('/payments/:id', validate(adminReasonSchema), asyncHandler(deleteAdminPayment));
adminRouter.post('/invoices/:id/void-and-recreate', validate(adminInvoiceReplacementSchema), asyncHandler(voidAndRecreateAdminInvoice));
adminRouter.get('/audit-logs', validate(adminAuditQuerySchema, 'query'), asyncHandler(listAdminAuditLogs));
