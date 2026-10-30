import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Clock3, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CollaborationForm } from '@/features/collaborations/CollaborationForm';
import { api, apiMessage } from '@/services/api';
import { toPaisa } from '@/lib/format';
import { useProductExperience } from '@/context/ProductExperienceContext';

function payload(values) {
  const cleanDate = (value) => value || null;
  return {
    ...values,
    dealValuePaisa: toPaisa(values.dealValue),
    dealValue: undefined,
    startDate: cleanDate(values.startDate),
    deadline: cleanDate(values.deadline),
    paymentDueDate: cleanDate(values.paymentDueDate),
    deliverables: values.deliverables?.length
      ? values.deliverables.map((item) => ({ ...item, dueDate: cleanDate(item.dueDate) }))
      : undefined,
  };
}

export function NewCollaborationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signalMilestone } = useProductExperience();
  const mutation = useMutation({
    mutationFn: (values) => api.post('/collaborations', payload(values)),
    onSuccess: () => {
      toast.success('Collaboration added');
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      signalMilestone('Collaboration Created');
      navigate('/app/collaborations');
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  return (
    <div className="page form-page new-collaboration-page">
      <Link className="back-link new-collaboration-back" to="/app/collaborations"><ArrowLeft size={16}/> Collaborations</Link>
      <header className="new-collaboration-heading">
        <span className="new-collaboration-heading-icon"><Sparkles size={20}/></span>
        <div>
          <span className="eyebrow">NEW DEAL</span>
          <h1>Add a collaboration</h1>
          <p>Add the deal essentials and the content you have agreed to deliver.</p>
          <div className="new-collaboration-promises">
            <span><Clock3 size={14}/> Takes less than a minute</span>
            <span><Check size={14}/> Deliverables included</span>
          </div>
        </div>
      </header>
      <CollaborationForm
        onSubmit={(values) => mutation.mutate(values)}
        loading={mutation.isPending}
        submitLabel="Add collaboration"
        cancelTo="/app/collaborations"
      />
    </div>
  );
}

export { payload as collaborationPayload };
