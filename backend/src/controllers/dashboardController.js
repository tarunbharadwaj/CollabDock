import { Collaboration } from '../models/Collaboration.js';
import { Deliverable } from '../models/Deliverable.js';
import { isActiveCollaboration, isCompletedCollaboration, paymentStatus } from '../utils/finance.js';

export async function getDashboard(req, res) {
  const [collaborations, upcoming] = await Promise.all([
    Collaboration.find({ ownerUid: req.user.uid }).sort({ updatedAt: -1 }),
    Deliverable.find({ ownerUid: req.user.uid, status: { $nin: ['Approved', 'Published'] }, dueDate: { $ne: null } })
      .populate('collaboration', 'brandName status dealValuePaisa receivedPaisa').sort({ dueDate: 1 }).limit(24),
  ]);
  const metrics = collaborations.reduce((acc, item) => {
    if (item.status === 'Cancelled') {
      acc.cancelledCollaborations += 1;
      return acc;
    }
    if (isActiveCollaboration(item)) acc.activeCollaborations += 1;
    if (isCompletedCollaboration(item)) acc.completedCollaborations += 1;
    acc.totalDealValuePaisa += item.dealValuePaisa;
    acc.paymentsReceivedPaisa += item.receivedPaisa;
    acc.pendingPaymentsPaisa += Math.max(0, item.dealValuePaisa - item.receivedPaisa);
    return acc;
  }, { activeCollaborations: 0, completedCollaborations: 0, cancelledCollaborations: 0, totalDealValuePaisa: 0, pendingPaymentsPaisa: 0, paymentsReceivedPaisa: 0 });
  const validDeals = collaborations.filter((item) => item.status !== 'Cancelled');
  const pendingPayments = validDeals
    .map((item) => ({ ...item.toObject(), outstandingPaisa: Math.max(0, item.dealValuePaisa - item.receivedPaisa), paymentStatus: paymentStatus(item) }))
    .filter((item) => item.outstandingPaisa > 0).sort((a, b) => new Date(a.paymentDueDate || '2999-01-01') - new Date(b.paymentDueDate || '2999-01-01')).slice(0, 5);
  const recentCollaborations = collaborations.slice(0, 5).map((item) => ({ ...item.toObject(), outstandingPaisa: Math.max(0, item.dealValuePaisa - item.receivedPaisa), paymentStatus: paymentStatus(item) }));
  const upcomingDeadlines = upcoming.filter((item) => isActiveCollaboration(item.collaboration)).slice(0, 8);
  res.json({ data: { metrics, upcomingDeadlines, recentCollaborations, pendingPayments } });
}
