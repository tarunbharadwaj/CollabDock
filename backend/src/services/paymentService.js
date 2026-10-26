import { Collaboration } from '../models/Collaboration.js';
import { Payment } from '../models/Payment.js';
import { AppError } from '../utils/errors.js';

export async function recordPayment(ownerUid, collaborationId, data) {
  const paymentTotal = { $add: ['$receivedPaisa', data.amountPaisa] };
  const collaboration = await Collaboration.findOneAndUpdate(
    {
      _id: collaborationId,
      ownerUid,
      status: { $ne: 'Cancelled' },
      $expr: { $lte: [paymentTotal, '$dealValuePaisa'] },
    },
    [{
      $set: {
        receivedPaisa: paymentTotal,
        status: { $cond: [{ $eq: [paymentTotal, '$dealValuePaisa'] }, 'Completed', '$status'] },
      },
    }],
    { new: false },
  );
  if (!collaboration) throw new AppError(400, 'Payment exceeds the outstanding balance, or the collaboration is unavailable', 'PAYMENT_EXCEEDS_BALANCE');
  const completedByPayment = collaboration.receivedPaisa + data.amountPaisa === collaboration.dealValuePaisa;
  try {
    const payment = await Payment.create({ ...data, ownerUid, collaboration: collaborationId });
    return { payment, collaboration };
  } catch (error) {
    const rollback = { $inc: { receivedPaisa: -data.amountPaisa } };
    if (completedByPayment) rollback.$set = { status: collaboration.status };
    await Collaboration.updateOne({ _id: collaborationId, ownerUid }, rollback);
    throw error;
  }
}

export async function removePayment(ownerUid, paymentId) {
  const payment = await Payment.findOneAndDelete({ _id: paymentId, ownerUid });
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
  await Collaboration.updateOne({ _id: payment.collaboration, ownerUid }, { $inc: { receivedPaisa: -payment.amountPaisa } });
  return payment;
}
