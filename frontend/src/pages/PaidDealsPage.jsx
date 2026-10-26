import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BadgeCheck, BriefcaseBusiness, ChevronRight, IndianRupee, Search, Sparkles, X } from 'lucide-react';
import { api } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { PaymentBadge } from '@/components/Badges';

export function PaidDealsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading } = useQuery({
    queryKey: ['collaborations', 'paid', deferredSearch],
    queryFn: async () => (await api.get('/collaborations', {
      params: { paymentStatus: 'paid', search: deferredSearch || undefined, limit: 50 },
    })).data,
  });
  const items = (data?.data || []).filter((item) => item.dealValuePaisa > 0 && item.paymentStatus === 'Paid');
  const totalPaidPaisa = items.reduce((total, item) => total + item.receivedPaisa, 0);
  const averageDealPaisa = items.length ? Math.round(totalPaidPaisa / items.length) : 0;

  return (
    <div className="page paid-deals-page">
      <PageHeader
        eyebrow="DEAL ARCHIVE"
        title="Paid Deals"
        description="Your completed collaborations and fully received payments, all in one place."
        action={<Link className="button button-outline button-md" to="/app/collaborations"><BriefcaseBusiness size={16}/> Current deals</Link>}
      />

      {!isLoading && items.length > 0 && (
        <section className="paid-overview" aria-label="Paid deals overview">
          <article className="paid-total-card">
            <div className="paid-card-label"><span><IndianRupee size={17}/></span> Total received</div>
            <strong>{inr(totalPaidPaisa)}</strong>
            <p>Collected across the completed deals shown below.</p>
            <div className="paid-card-orbit" aria-hidden="true"/>
          </article>
          <article className="paid-overview-stat">
            <span className="paid-stat-icon green"><BadgeCheck size={19}/></span>
            <div><small>COMPLETED DEALS</small><strong>{items.length}</strong><p>Fully settled collaborations</p></div>
          </article>
          <article className="paid-overview-stat">
            <span className="paid-stat-icon violet"><Sparkles size={18}/></span>
            <div><small>AVERAGE DEAL</small><strong>{inr(averageDealPaisa)}</strong><p>Based on this view</p></div>
          </article>
        </section>
      )}

      <section className="paid-collection">
        <header className="paid-collection-header">
          <div>
            <h2>Completed collaborations</h2>
            <p>A searchable record of work that has been fully paid.</p>
          </div>
          {!isLoading && <span className="paid-result-count">{items.length} {items.length === 1 ? 'deal' : 'deals'}</span>}
        </header>

        <div className="paid-search-wrap">
          <label className="paid-search-box">
            <Search size={18}/>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search completed brands or campaigns..."/>
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={16}/></button>}
          </label>
        </div>

        {isLoading ? (
          <div className="paid-loading-list">{[1, 2, 3].map((item) => <Skeleton key={item} className="row-skeleton"/>)}</div>
        ) : items.length ? (
          <>
            <div className="paid-deals-table">
              <div className="paid-table-head"><span>Brand and campaign</span><span>Amount received</span><span>Paid on</span><span>Status</span><span/></div>
              {items.map((item) => (
                <Link to={`/app/collaborations/${item._id}`} className="paid-deal-row" key={item._id}>
                  <span className="brand-cell paid-brand-cell"><i>{item.brandName[0]}</i><span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform}</small></span></span>
                  <strong className="paid-deal-value">{inr(item.dealValuePaisa)}</strong>
                  <span className="paid-date"><strong>{item.paidAt ? shortDate(item.paidAt) : 'Recorded'}</strong><small>Final payment</small></span>
                  <PaymentBadge value="Paid"/>
                  <span className="paid-row-arrow"><ChevronRight size={18}/></span>
                </Link>
              ))}
            </div>
            <div className="paid-mobile-list">
              {items.map((item) => (
                <Link to={`/app/collaborations/${item._id}`} className="paid-mobile-card" key={item._id}>
                  <header>
                    <span className="brand-cell paid-brand-cell"><i>{item.brandName[0]}</i><span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform}</small></span></span>
                    <ChevronRight size={18}/>
                  </header>
                  <div className="paid-mobile-amount"><small>AMOUNT RECEIVED</small><strong>{inr(item.dealValuePaisa)}</strong></div>
                  <footer><span><BadgeCheck size={15}/> Fully settled</span><span>{item.paidAt ? shortDate(item.paidAt) : 'Recorded'}</span></footer>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="paid-empty-wrap">
            <EmptyState
              icon={search ? Search : BadgeCheck}
              title={search ? 'No paid deals found' : 'No paid deals yet'}
              description={search ? 'Try a different brand or campaign name.' : 'A collaboration appears here automatically after its outstanding balance reaches zero.'}
              action={search
                ? <button className="button button-secondary button-md" type="button" onClick={() => setSearch('')}>Clear search</button>
                : <Link className="button button-secondary button-md" to="/app/collaborations"><BriefcaseBusiness size={16}/> Browse collaborations</Link>}
            />
          </div>
        )}

        <footer className="paid-collection-footnote"><BadgeCheck size={15}/> Final payments move collaborations here automatically.</footer>
      </section>
    </div>
  );
}
