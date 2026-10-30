import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareHeart, Search, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '@/services/api';
import { shortDate } from '@/lib/format';
import { AdminError, AdminPagination, AdminStatus } from '@/features/admin/AdminComponents';
import { Button, EmptyState, Input, Modal, Select, Skeleton, Textarea } from '@/components/ui';

const STATUS_OPTIONS = ['New', 'Reviewed', 'Planned', 'Closed'];
const CATEGORY_OPTIONS = ['General', 'Bug', 'Confusing', 'Idea', 'Other'];
const CONTEXT_OPTIONS = ['Collaboration Created', 'Payment Recorded', 'Invoice Created', 'Manual'];

function Rating({ value }) {
  return <span className="admin-feedback-rating" aria-label={`${value} out of 5`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < value ? 'currentColor' : 'none'}/>)}</span>;
}

export function AdminFeedbackPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [category, setCategory] = useState('');
  const [context, setContext] = useState('');
  const [sort, setSort] = useState('newest');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Reviewed');
  const [internalNote, setInternalNote] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const queryClient = useQueryClient();

  useEffect(() => setPage(1), [deferredSearch, status, rating, category, context, sort, from, to]);
  useEffect(() => {
    if (!selected) return;
    setReviewStatus(selected.status);
    setInternalNote(selected.internalNote || '');
  }, [selected]);

  const query = useQuery({
    queryKey: ['admin', 'feedback', page, deferredSearch, status, rating, category, context, sort, from, to],
    queryFn: async () => (await api.get('/admin/feedback', { params: {
      page,
      limit: 25,
      search: deferredSearch || undefined,
      status: status || undefined,
      rating: rating || undefined,
      category: category || undefined,
      context: context || undefined,
      sort,
      from: from || undefined,
      to: to || undefined,
    } })).data,
  });

  const update = useMutation({
    mutationFn: () => api.patch(`/admin/feedback/${selected._id}`, { status: reviewStatus, internalNote: internalNote.trim() }),
    onSuccess: () => {
      toast.success('Feedback review updated');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  const clearFilters = () => {
    setSearch(''); setStatus(''); setRating(''); setCategory(''); setContext(''); setSort('newest'); setFrom(''); setTo('');
  };
  const hasFilters = Boolean(search || status || rating || category || context || from || to || sort !== 'newest');
  const rows = query.data?.data || [];

  return (
    <div className="admin-page admin-feedback-page">
      <header className="admin-page-heading"><div><span>Creator voice</span><h1>Feedback</h1><p>Review what creators love, where they get stuck, and what they need next.</p></div>{query.data?.meta && <strong className="admin-feedback-total">{query.data.meta.total} responses</strong>}</header>

      <section className="admin-panel admin-feedback-filters">
        <label className="admin-feedback-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search creator or feedback..."/>{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15}/></button>}</label>
        <Select aria-label="Feedback status" value={status} onChange={(event) => setStatus(event.target.value)} placeholder="All statuses"><option value="">All statuses</option>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="Feedback rating" value={rating} onChange={(event) => setRating(event.target.value)} placeholder="All ratings"><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} stars</option>)}</Select>
        <Select aria-label="Feedback category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="All categories"><option value="">All categories</option>{CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="Feedback context" value={context} onChange={(event) => setContext(event.target.value)} placeholder="All moments"><option value="">All moments</option>{CONTEXT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="Feedback sorting" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="rating-high">Highest rating</option><option value="rating-low">Lowest rating</option></Select>
        <Input label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)}/>
        <Input label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)}/>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X size={15}/> Clear filters</Button>}
      </section>

      {query.isLoading && <div className="admin-panel admin-loading-list">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index}/>)}</div>}
      {query.isError && <AdminError retry={() => query.refetch()}/>} 
      {query.data && <section className="admin-panel admin-feedback-panel">
        {rows.length ? <div className="admin-feedback-list">{rows.map((item) => <button type="button" key={item._id} onClick={() => setSelected(item)}>
          <span className="admin-feedback-avatar">{item.creatorName?.[0]?.toUpperCase() || item.creatorEmail?.[0]?.toUpperCase() || 'C'}</span>
          <span className="admin-feedback-copy"><span><strong>{item.creatorName || 'Creator'}</strong><small>{item.creatorEmail}</small></span><Rating value={item.rating}/><p>{item.message || 'Rating submitted without an additional comment.'}</p><small>{item.context} · {item.category} · {item.deviceClass}</small></span>
          <span className="admin-feedback-meta"><AdminStatus value={item.status}/><time>{shortDate(item.createdAt)}</time></span>
        </button>)}</div> : <EmptyState icon={MessageSquareHeart} title="No feedback found" description={hasFilters ? 'Try clearing one or more filters.' : 'Creator feedback will appear here after it is submitted.'}/>} 
        <AdminPagination meta={query.data.meta} onPage={setPage}/>
      </section>}

      <Modal open={Boolean(selected)} onClose={() => !update.isPending && setSelected(null)} title="Review creator feedback" description={selected ? `${selected.creatorName || 'Creator'} · ${selected.creatorEmail}` : ''} size="admin-feedback-modal">
        {selected && <div className="admin-feedback-review">
          <div className="admin-feedback-review-summary"><Rating value={selected.rating}/><span>{selected.category}</span><span>{selected.context}</span></div>
          <blockquote>{selected.message || 'No written comment was provided.'}</blockquote>
          <dl><div><dt>Page</dt><dd>{selected.path}</dd></div><div><dt>Device</dt><dd>{selected.deviceClass}</dd></div><div><dt>Submitted</dt><dd>{shortDate(selected.createdAt)}</dd></div></dl>
          <Select label="Review status" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</Select>
          <Textarea label="Internal note" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows="4" maxLength="2000" placeholder="Add context for future product decisions"/>
          <div className="modal-actions"><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button loading={update.isPending} onClick={() => update.mutate()}>Save review</Button></div>
        </div>}
      </Modal>
    </div>
  );
}
