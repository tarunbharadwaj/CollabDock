import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '@/services/api';
import { inr, toPaisa } from '@/lib/format';
import { Button, Input, Modal, MoneyInput, Select, Textarea } from '@/components/ui';
import { useProductExperience } from '@/context/ProductExperienceContext';

export function RecordPaymentModal({ collaboration, open, onClose }) {
  const queryClient = useQueryClient();
  const { signalMilestone } = useProductExperience();
  const [amount, setAmount] = useState('');
  const amountPaisa = toPaisa(amount);
  const isFullAmount = amount !== '' && amountPaisa === collaboration.outstandingPaisa;
  const exceedsOutstanding = amount !== '' && amountPaisa > collaboration.outstandingPaisa;
  const amountError = exceedsOutstanding
    ? `${inr(amountPaisa - collaboration.outstandingPaisa)} above the outstanding balance. Maximum: ${inr(collaboration.outstandingPaisa)}.`
    : amount !== '' && amountPaisa <= 0
      ? 'Enter an amount greater than zero.'
      : '';
  const mutation = useMutation({
    mutationFn: (payload) => api.post(`/collaborations/${collaboration._id}/payments`, payload),
    onSuccess: () => {
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['collaboration', collaboration._id] });
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      setAmount('');
      onClose();
      signalMilestone('Payment Recorded');
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const submittedAmountPaisa = toPaisa(values.amount);
    if (submittedAmountPaisa <= 0) return toast.error('Enter an amount greater than zero');
    if (submittedAmountPaisa > collaboration.outstandingPaisa) return toast.error('Payment cannot exceed the outstanding amount');
    mutation.mutate({ ...values, amountPaisa: submittedAmountPaisa, paymentDate: values.paymentDate });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a payment"
      description={`${collaboration.brandName} - ${inr(collaboration.outstandingPaisa)} outstanding`}
    >
      <form className="modal-form" onSubmit={submit}>
        <MoneyInput
          label="Amount received (₹)"
          name="amount"
          value={amount}
          onValueChange={setAmount}
          placeholder="0"
          error={amountError}
          required
          autoFocus
        />
        <button
          type="button"
          className={`full-payment-option ${isFullAmount ? 'selected' : ''}`}
          aria-pressed={isFullAmount}
          onClick={() => setAmount(String(collaboration.outstandingPaisa / 100))}
        >
          <span className="full-payment-icon">
            {isFullAmount ? <Check size={17} strokeWidth={2.4}/> : <IndianRupee size={17}/>} 
          </span>
          <span>
            <strong>Use full outstanding amount</strong>
            <small>Fill {inr(collaboration.outstandingPaisa)} and mark this collaboration paid</small>
          </span>
        </button>
        <Input label="Payment date" name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required/>
        <Select label="Payment method" name="paymentMethod">
          <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Other</option>
        </Select>
        <Input label="Reference ID" name="referenceId" placeholder="Optional transaction reference"/>
        <Textarea label="Notes" name="notes" rows="2"/>
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending} disabled={!amount || amountPaisa <= 0 || exceedsOutstanding}>
            Record {amount ? inr(amountPaisa) : 'payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
