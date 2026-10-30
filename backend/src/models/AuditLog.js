import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorUid: { type: String, required: true, index: true },
  actorEmail: { type: String, default: '' },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true, index: true },
  targetId: { type: String, required: true },
  targetOwnerUid: { type: String, default: '', index: true },
  reason: { type: String, required: true },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true, versionKey: false });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetOwnerUid: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const preventMutation = () => { throw new Error('Audit logs are immutable'); };
for (const operation of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete']) {
  auditLogSchema.pre(operation, preventMutation);
}

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
