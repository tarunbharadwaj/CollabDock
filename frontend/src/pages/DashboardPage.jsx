import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  IndianRupee,
  Plus,
  ReceiptIndianRupee,
  WalletCards,
} from 'lucide-react';
import { api } from '@/services/api';
import { useProfile } from '@/hooks/useProfile';
import { inr, relativeDate, shortDate } from '@/lib/format';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { PaymentBadge, StatusBadge } from '@/components/Badges';

async function getAllCollaborations() {
  const firstResponse = await api.get('/collaborations', { params: { page: 1, limit: 50 } });
  const firstPage = firstResponse.data;
  const totalPages = firstPage.meta?.pages || 1;

  if (totalPages <= 1) return firstPage.data || [];

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => (
      api.get('/collaborations', { params: { page: index + 2, limit: 50 } })
    )),
  );

  return [
    ...(firstPage.data || []),
    ...remainingResponses.flatMap((response) => response.data.data || []),
  ];
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data.data,
  });
  const { data: collaborations = [], isLoading: areCollaborationsLoading } = useQuery({
    queryKey: ['collaborations', 'dashboard-summary'],
    queryFn: getAllCollaborations,
  });
  const { data: profile } = useProfile();
  const collaborationMetrics = collaborations.reduce((metrics, collaboration) => {
    if (collaboration.status === 'Cancelled') metrics.cancelled += 1;
    else if (collaboration.paymentStatus === 'Paid') metrics.completed += 1;
    else if (collaboration.status !== 'Completed') metrics.active += 1;
    return metrics;
  }, { active: 0, completed: 0, cancelled: 0 });

  if (isLoading || areCollaborationsLoading) {
    return (
      <div className="page dashboard-page">
        <PageHeader title="Your overview"/>
        <div className="dashboard-kpi-loading">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="dashboard-kpi-skeleton"/>)}
        </div>
        <Skeleton className="panel-skeleton"/>
      </div>
    );
  }

  const primaryStats = [
    {
      label: 'Active collaborations',
      value: collaborationMetrics.active,
      helper: 'Deals currently in progress',
      icon: BriefcaseBusiness,
      tone: 'violet',
      to: '/app/collaborations',
    },
    {
      label: 'Total deal value',
      value: inr(data?.metrics.totalDealValuePaisa),
      helper: 'Across non-cancelled deals',
      icon: IndianRupee,
      tone: 'blue',
      to: '/app/collaborations',
    },
    {
      label: 'Pending payments',
      value: inr(data?.metrics.pendingPaymentsPaisa),
      helper: 'Still waiting to be collected',
      icon: WalletCards,
      tone: 'amber',
      to: '/app/payments',
    },
    {
      label: 'Payments received',
      value: inr(data?.metrics.paymentsReceivedPaisa),
      helper: 'Recorded across all deals',
      icon: ReceiptIndianRupee,
      tone: 'green',
      to: '/app/payments',
    },
  ];

  return (
    <div className="page dashboard-page dashboard-clean">
      <PageHeader
        eyebrow="OVERVIEW"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${profile?.displayName?.split(' ')[0] || 'creator'}.`}
        description="Here's what is happening with your brand deals."
        action={<Link className="button button-primary button-md" to="/app/collaborations/new"><Plus size={17}/> Add collaboration</Link>}
      />

      <section className="dashboard-kpi-grid" aria-label="Business overview">
        {primaryStats.map(({ label, value, helper, icon: Icon, tone, to }) => (
          <Link className={`dashboard-kpi-card ${tone}`} to={to} key={label}>
            <header><span>{label}</span><i><Icon size={18}/></i></header>
            <strong>{value}</strong>
            <footer><span>{helper}</span><ArrowRight size={14}/></footer>
          </Link>
        ))}
      </section>

      <section className="dashboard-deal-history">
        <div className="dashboard-history-copy">
          <span>Deal history</span>
          <small>Completed and cancelled collaborations</small>
        </div>
        <Link className="dashboard-history-stat completed" to="/app/paid-deals">
          <i><CheckCircle2 size={16}/></i><span><small>Completed</small><strong>{collaborationMetrics.completed}</strong></span>
        </Link>
        <div className="dashboard-history-stat cancelled">
          <i><Ban size={16}/></i><span><small>Cancelled</small><strong>{collaborationMetrics.cancelled}</strong></span>
        </div>
        <Link className="dashboard-history-link" to="/app/paid-deals">View paid deals <ArrowRight size={14}/></Link>
      </section>

      <nav className="dashboard-clean-actions" aria-label="Quick actions">
        <Link to="/app/collaborations/new"><Plus size={16}/> New collaboration</Link>
        <Link to="/app/invoices/new"><FilePlus2 size={16}/> Create invoice</Link>
        <Link to="/app/payments"><ReceiptIndianRupee size={16}/> Record payment</Link>
      </nav>

      <div className="dashboard-clean-content">
        <section className="dashboard-clean-card">
          <header><div><h2>Upcoming deadlines</h2><p>Content that needs your attention next</p></div><Link to="/app/collaborations">View all <ArrowRight size={14}/></Link></header>
          {data.upcomingDeadlines.length ? (
            <div className="deadline-list">
              {data.upcomingDeadlines.map((item) => (
                <Link to={`/app/collaborations/${item.collaboration?._id}`} key={item._id}>
                  <span className={`date-tile ${new Date(item.dueDate) < new Date() ? 'danger' : ''}`}><strong>{new Date(item.dueDate).getDate()}</strong><small>{new Date(item.dueDate).toLocaleString('en', { month: 'short' })}</small></span>
                  <span><strong>{item.title}</strong><small>{item.collaboration?.brandName} · {item.contentType}</small></span>
                  <span className="deadline-meta"><StatusBadge value={item.status}/><small>{relativeDate(item.dueDate)}</small></span>
                </Link>
              ))}
            </div>
          ) : <EmptyState icon={CalendarDays} title="Nothing due yet" description="Add a deliverable with a due date and it will appear here."/>}
        </section>

        <section className="dashboard-clean-card">
          <header><div><h2>Pending payments</h2><p>Brands you may need to follow up with</p></div><Link to="/app/payments">View all <ArrowRight size={14}/></Link></header>
          {data.pendingPayments.length ? data.pendingPayments.map((item) => (
            <Link to="/app/payments" className="pending-mini" key={item._id}>
              <span><strong>{item.brandName}</strong><small>{shortDate(item.paymentDueDate)}</small></span>
              <span><strong>{inr(item.outstandingPaisa)}</strong><PaymentBadge value={item.paymentStatus}/></span>
            </Link>
          )) : <EmptyState icon={IndianRupee} title="All settled" description="You have no pending payments."/>}
        </section>
      </div>

      <section className="dashboard-clean-card dashboard-clean-recent">
        <header><div><h2>Recent collaborations</h2><p>Your recently updated brand deals</p></div><Link to="/app/collaborations">View all <ArrowRight size={14}/></Link></header>
        {data.recentCollaborations.length ? (
          <div className="data-list">
            {data.recentCollaborations.map((item) => (
              <Link to={`/app/collaborations/${item._id}`} key={item._id}>
                <span className="brand-avatar">{item.brandName[0]}</span>
                <span><strong>{item.brandName}</strong><small>{item.campaignTitle || 'Untitled campaign'} · Updated {relativeDate(item.updatedAt)}</small></span>
                <strong>{inr(item.dealValuePaisa)}</strong>
                <StatusBadge value={item.status}/>
              </Link>
            ))}
          </div>
        ) : <EmptyState icon={BriefcaseBusiness} title="No collaborations yet" description="Add your first brand deal to get started." action={<Link className="button button-primary button-sm" to="/app/collaborations/new">Add your first deal</Link>}/>} 
      </section>
    </div>
  );
}
