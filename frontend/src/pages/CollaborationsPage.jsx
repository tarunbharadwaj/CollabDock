import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, ChevronRight, IndianRupee, Plus, Search, WalletCards, X } from 'lucide-react';
import { api } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { EmptyState, PageHeader, Select, Skeleton } from '@/components/ui';
import { PaymentBadge, StatusBadge } from '@/components/Badges';

const statuses = ['Lead', 'Confirmed', 'In Progress', 'Content Submitted', 'Completed', 'Cancelled'];

function isPastDeadline(item) {
  if (!item.deadline || ['Completed', 'Cancelled'].includes(item.status)) return false;
  const deadline = new Date(item.deadline);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < Date.now();
}

export function CollaborationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('created');
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading } = useQuery({
    queryKey: ['collaborations', 'outstanding', deferredSearch, status, sort],
    queryFn: async () => (await api.get('/collaborations', {
      params: { search: deferredSearch || undefined, status: status || undefined, paymentStatus: 'outstanding', sort, limit: 50 },
    })).data,
  });
  const items = (data?.data || []).filter((item) => item.paymentStatus !== 'Paid');
  const valuedItems = items.filter((item) => item.status !== 'Cancelled');
  const totalDealValuePaisa = valuedItems.reduce((total, item) => total + item.dealValuePaisa, 0);
  const totalOutstandingPaisa = valuedItems.reduce((total, item) => total + item.outstandingPaisa, 0);
  const hasFilters = Boolean(search || status || sort !== 'created');

  function clearFilters() {
    setSearch('');
    setStatus('');
    setSort('created');
  }

  return (
    <div className="page collaborations-page">
      <PageHeader
        eyebrow="DEALS"
        title="Collaborations"
        description="Manage every brand relationship from the first conversation to final payment."
        action={<Link className="button button-primary button-md" to="/app/collaborations/new"><Plus size={17}/> Add collaboration</Link>}
      />

      {!isLoading && items.length > 0 && (
        <section className="collaboration-overview" aria-label="Collaboration overview">
          <article className="collaboration-pipeline-card">
            <span className="collaboration-overview-icon"><BriefcaseBusiness size={19}/></span>
            <div><small>DEALS IN THIS VIEW</small><strong>{items.length}</strong><p>Current collaboration records</p></div>
            <span className="collaboration-card-orbit" aria-hidden="true"/>
          </article>
          <article className="collaboration-overview-stat value">
            <span className="collaboration-overview-icon"><IndianRupee size={19}/></span>
            <div><small>AGREED VALUE</small><strong>{inr(totalDealValuePaisa)}</strong><p>Excluding cancelled deals</p></div>
          </article>
          <article className="collaboration-overview-stat pending">
            <span className="collaboration-overview-icon"><WalletCards size={19}/></span>
            <div><small>PENDING BALANCE</small><strong>{inr(totalOutstandingPaisa)}</strong><p>Still expected from brands</p></div>
          </article>
        </section>
      )}

      <section className="collaboration-library">
        <header className="collaboration-library-header">
          <div><h2>Deal pipeline</h2><p>Search, filter, and open a collaboration to manage its details.</p></div>
          {!isLoading && <span>{items.length} {items.length === 1 ? 'deal' : 'deals'}</span>}
        </header>

        <div className="collaboration-controls">
          <label className="collaboration-search-box">
            <Search size={18}/>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand or campaign..."/>
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear collaboration search"><X size={16}/></button>}
          </label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter collaboration status" className="collaboration-filter-select">
            <option value="">All statuses</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort collaborations" className="collaboration-sort-select">
            <option value="created">Newest first</option>
            <option value="deadline">Deadline soonest</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="collaboration-loading-list">{[1, 2, 3].map((item) => <Skeleton key={item} className="row-skeleton"/>)}</div>
        ) : items.length ? (
          <>
            <div className="collaboration-modern-table">
              <div className="collaboration-table-head"><span>Brand and campaign</span><span>Deal value</span><span>Status</span><span>Deadline</span><span>Payment</span><span/></div>
              {items.map((item) => {
                const deadlinePassed = isPastDeadline(item);
                return (
                  <Link to={`/app/collaborations/${item._id}`} className={`collaboration-modern-row ${deadlinePassed ? 'is-late' : ''}`} key={item._id}>
                    <span className="brand-cell collaboration-brand-cell"><i>{item.brandName[0]}</i><span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform || 'Untitled campaign'}</small></span></span>
                    <span className="collaboration-value-cell"><strong>{inr(item.dealValuePaisa)}</strong><small>{item.outstandingPaisa > 0 ? `${inr(item.outstandingPaisa)} pending` : 'No balance'}</small></span>
                    <StatusBadge value={item.status}/>
                    <span className="collaboration-deadline-cell"><strong>{item.deadline ? shortDate(item.deadline) : 'Not set'}</strong><small>{deadlinePassed ? 'Past deadline' : 'Content deadline'}</small></span>
                    <PaymentBadge value={item.paymentStatus}/>
                    <span className="collaboration-row-arrow"><ChevronRight size={18}/></span>
                  </Link>
                );
              })}
            </div>

            <div className="collaboration-mobile-list">
              {items.map((item) => {
                const deadlinePassed = isPastDeadline(item);
                const paymentProgress = item.dealValuePaisa ? Math.min(100, item.receivedPaisa / item.dealValuePaisa * 100) : 0;
                return (
                  <Link to={`/app/collaborations/${item._id}`} className={`collaboration-mobile-card ${deadlinePassed ? 'is-late' : ''}`} key={item._id}>
                    <header><span className="brand-cell collaboration-brand-cell"><i>{item.brandName[0]}</i><span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform || 'Untitled campaign'}</small></span></span><ChevronRight size={18}/></header>
                    <div className="collaboration-mobile-badges"><StatusBadge value={item.status}/><PaymentBadge value={item.paymentStatus}/></div>
                    <div className="collaboration-mobile-values">
                      <span><small>Deal value</small><strong>{inr(item.dealValuePaisa)}</strong></span>
                      <span><small>Outstanding</small><strong>{inr(item.outstandingPaisa)}</strong></span>
                    </div>
                    <div className="collaboration-payment-progress"><span><i style={{ width: `${paymentProgress}%` }}/></span><small>{Math.round(paymentProgress)}% paid</small></div>
                    <footer className={deadlinePassed ? 'late' : ''}><CalendarDays size={14}/><span><small>{deadlinePassed ? 'Past deadline' : 'Content deadline'}</small><strong>{item.deadline ? shortDate(item.deadline) : 'Not set'}</strong></span></footer>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="collaboration-empty-wrap">
            <EmptyState
              icon={hasFilters ? Search : BriefcaseBusiness}
              title={hasFilters ? 'No collaborations found' : 'No current collaborations'}
              description={hasFilters ? 'Try changing your search, status, or sort option.' : 'Add a new deal here, or review fully settled work in Paid Deals.'}
              action={hasFilters
                ? <button className="button button-secondary button-md" type="button" onClick={clearFilters}>Clear filters</button>
                : <Link className="button button-primary button-md" to="/app/collaborations/new"><Plus size={16}/> Add your first deal</Link>}
            />
          </div>
        )}

        <footer className="collaboration-library-note"><CalendarDays size={15}/> Fully paid collaborations move to Paid Deals automatically.</footer>
      </section>
    </div>
  );
}
