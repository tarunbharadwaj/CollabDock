import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  Clock3,
  IndianRupee,
  MessageCircleMore,
  Search,
  WalletCards,
  X,
} from 'lucide-react';
import { api } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { PaymentBadge } from '@/components/Badges';
import { RecordPaymentModal } from '@/features/payments/RecordPaymentModal';
import { PaymentReminderModal } from '@/features/payments/PaymentReminderModal';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
];

export function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => (await api.get('/payments')).data,
  });
  const [recording, setRecording] = useState(null);
  const [reminding, setReminding] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const rows = data?.data || [];
  const visibleRows = rows.filter((item) => {
    const matchesSearch = !deferredSearch || [item.brandName, item.campaignTitle, item.platform]
      .some((value) => value?.toLowerCase().includes(deferredSearch));
    const matchesFilter = filter === 'all'
      || (filter === 'outstanding' && item.outstandingPaisa > 0)
      || (filter === 'overdue' && item.paymentStatus === 'Overdue')
      || (filter === 'paid' && item.paymentStatus === 'Paid');
    return matchesSearch && matchesFilter;
  });
  function resetFilters() {
    setSearch('');
    setFilter('all');
  }

  if (isLoading) {
    return (
      <div className="page payments-page">
        <PageHeader title="Payments" />
        <div className="payment-overview" data-tour="payments-overview">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="payment-overview-skeleton" />)}
        </div>
        <Skeleton className="panel-skeleton" />
      </div>
    );
  }

  return (
    <div className="page payments-page">
      <PageHeader
        eyebrow="MONEY"
        title="Payments"
        description="See what has arrived, what is still due, and which brands need a follow-up."
        action={<Link className="button button-outline button-md" to="/app/paid-deals"><BadgeCheck size={16}/> Paid deals</Link>}
      />

      <section className="payment-overview" data-tour="payments-overview" aria-label="Payment overview">
        <article className="payment-outstanding-card">
          <span className="payment-overview-icon"><WalletCards size={19}/></span>
          <div><small>TOTAL OUTSTANDING</small><strong>{inr(data.summary.outstandingPaisa)}</strong><p>Still expected from active brand deals</p></div>
          <span className="payment-card-orbit" aria-hidden="true"/>
        </article>
        <article className="payment-overview-stat received">
          <span className="payment-overview-icon"><IndianRupee size={19}/></span>
          <div><small>TOTAL RECEIVED</small><strong>{inr(data.summary.receivedPaisa)}</strong><p>Payments recorded so far</p></div>
        </article>
        <article className="payment-overview-stat overdue">
          <span className="payment-overview-icon"><Clock3 size={19}/></span>
          <div><small>OVERDUE</small><strong>{inr(data.summary.overduePaisa)}</strong><p>Past the saved due date</p></div>
        </article>
      </section>

      <section className="payment-collection">
        <header className="payment-collection-header">
          <div><h2>Collaboration payments</h2><p>Balances update automatically when you record a payment.</p></div>
          <span>{visibleRows.length} {visibleRows.length === 1 ? 'deal' : 'deals'}</span>
        </header>

        {rows.length > 0 && (
          <div className="payment-controls">
            <label className="payment-search-box">
              <Search size={18}/>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand or campaign..."/>
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear payment search"><X size={16}/></button>}
            </label>
            <div className="payment-filter-pills" aria-label="Filter payments">
              {FILTERS.map((option) => (
                <button key={option.value} type="button" className={filter === option.value ? 'active' : ''} aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>
              ))}
            </div>
          </div>
        )}

        {visibleRows.length ? (
          <>
            <div className="payment-modern-table" role="table" aria-label="Collaboration payments">
              <div className="payment-modern-head" role="row">
                <span role="columnheader">Brand and collaboration</span>
                <span role="columnheader">Payment progress</span>
                <span role="columnheader">Outstanding</span>
                <span role="columnheader">Due date</span>
                <span role="columnheader">Status</span>
                <span role="columnheader" className="sr-only">Actions</span>
              </div>
              {visibleRows.map((item) => {
                const progress = item.dealValuePaisa ? Math.min(100, item.receivedPaisa / item.dealValuePaisa * 100) : 0;
                const dueDate = item.paymentDueDate ? shortDate(item.paymentDueDate) : 'No due date';
                return (
                  <div className={`payment-modern-row ${item.paymentStatus === 'Overdue' ? 'is-overdue' : ''}`} role="row" key={item._id}>
                    <span className="brand-cell payment-brand-cell" role="cell">
                      <i aria-hidden="true">{item.brandName[0]}</i>
                      <span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform || 'Untitled campaign'}</small></span>
                    </span>
                    <span className="payment-progress-cell" role="cell">
                      <span><i style={{ width: `${progress}%` }}/></span>
                      <small>{inr(item.receivedPaisa)} of {inr(item.dealValuePaisa)}</small>
                    </span>
                    <strong className="payment-balance-cell" role="cell">{inr(item.outstandingPaisa)}</strong>
                    <span className="payment-due-cell" role="cell"><strong>{dueDate}</strong><small>{item.paymentStatus === 'Overdue' ? 'Payment overdue' : 'Payment due'}</small></span>
                    <span className="payment-status" role="cell"><PaymentBadge value={item.paymentStatus}/></span>
                    <span className="payment-modern-actions" role="cell">
                      {item.outstandingPaisa > 0 ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => setRecording(item)}>Record</Button>
                          <Button variant="ghost" size="icon" onClick={() => setReminding(item)} aria-label={`Send ${item.brandName} a payment reminder`} title="Send payment reminder"><MessageCircleMore size={17}/></Button>
                        </>
                      ) : <span className="payment-settled-label"><Check size={15}/> Settled</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="payment-modern-mobile-list">
              {visibleRows.map((item) => {
                const progress = item.dealValuePaisa ? Math.min(100, item.receivedPaisa / item.dealValuePaisa * 100) : 0;
                const dueDate = item.paymentDueDate ? shortDate(item.paymentDueDate) : 'No due date';
                return (
                  <article className={`payment-modern-card ${item.paymentStatus === 'Overdue' ? 'is-overdue' : ''}`} key={item._id}>
                    <header>
                      <span className="brand-cell payment-brand-cell"><i aria-hidden="true">{item.brandName[0]}</i><span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform || 'Untitled campaign'}</small></span></span>
                      <PaymentBadge value={item.paymentStatus}/>
                    </header>
                    <div className="payment-mobile-progress"><span><i style={{ width: `${progress}%` }}/></span><small>{Math.round(progress)}% collected</small></div>
                    <div className="payment-mobile-values">
                      <span><small>Received</small><strong>{inr(item.receivedPaisa)}</strong></span>
                      <span><small>Outstanding</small><strong>{inr(item.outstandingPaisa)}</strong></span>
                    </div>
                    <div className="payment-mobile-due"><Clock3 size={14}/><span><small>{item.paymentStatus === 'Overdue' ? 'Overdue since' : 'Payment due'}</small><strong>{dueDate}</strong></span></div>
                    {item.outstandingPaisa > 0 ? (
                      <footer>
                        <Button variant="secondary" size="sm" onClick={() => setReminding(item)}><MessageCircleMore size={15}/> Remind</Button>
                        <Button size="sm" onClick={() => setRecording(item)}>Record payment</Button>
                      </footer>
                    ) : <div className="payment-mobile-settled"><Check size={15}/> Payment fully settled</div>}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="payment-empty-wrap">
            <EmptyState
              icon={rows.length ? Search : Check}
              title={rows.length ? 'No matching payments' : 'No payment activity yet'}
              description={rows.length ? 'Try changing your search or payment filter.' : 'Add a collaboration to start tracking its payment balance.'}
              action={rows.length && <button className="button button-secondary button-md" type="button" onClick={resetFilters}>Clear filters</button>}
            />
          </div>
        )}

        <footer className="payment-collection-note"><IndianRupee size={15}/> Payment status is calculated from recorded amounts and due dates.</footer>
      </section>

      {recording && <RecordPaymentModal collaboration={recording} open onClose={() => setRecording(null)}/>}
      <PaymentReminderModal collaboration={reminding} onClose={() => setReminding(null)}/>
    </div>
  );
}
