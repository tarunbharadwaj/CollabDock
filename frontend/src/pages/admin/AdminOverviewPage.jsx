import { useQuery } from '@tanstack/react-query';
import { BadgeIndianRupee, Ban, BriefcaseBusiness, CircleCheck, FileText, ReceiptIndianRupee, UserCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { AdminError, AdminMetric, AdminStatus } from '@/features/admin/AdminComponents';
import { Skeleton } from '@/components/ui';

export function AdminOverviewPage() {
  const query = useQuery({ queryKey: ['admin', 'overview'], queryFn: async () => (await api.get('/admin/overview')).data.data });
  if (query.isLoading) return <div className="admin-page"><div className="admin-page-heading"><Skeleton className="admin-heading-skeleton"/></div><div className="admin-metric-grid">{Array.from({ length: 8 }, (_, index) => <Skeleton className="admin-metric-skeleton" key={index}/>)}</div></div>;
  if (query.isError) return <AdminError retry={() => query.refetch()}/>;
  const { metrics, recentCreators } = query.data;
  return (
    <div className="admin-page">
      <header className="admin-page-heading"><div><span>Platform operations</span><h1>Overview</h1><p>A clear view of creator activity and money moving through CollabDock.</p></div><Link className="button button-primary button-md" to="/admin/creators">View creators</Link></header>
      <section className="admin-metric-grid">
        <AdminMetric icon={UsersRound} label="Total creators" value={metrics.totalCreators} hint={`${metrics.onboardedCreators} onboarded`}/>
        <AdminMetric icon={UserCheck} label="Onboarded" value={metrics.onboardedCreators} tone="green"/>
        <AdminMetric icon={Ban} label="Suspended" value={metrics.suspendedCreators} tone="red"/>
        <AdminMetric icon={BriefcaseBusiness} label="Collaborations" value={metrics.collaborations} tone="blue"/>
        <AdminMetric icon={BadgeIndianRupee} label="Deal value" value={inr(metrics.dealValuePaisa)} tone="violet"/>
        <AdminMetric icon={CircleCheck} label="Payments received" value={inr(metrics.paymentsReceivedPaisa)} tone="green"/>
        <AdminMetric icon={ReceiptIndianRupee} label="Outstanding" value={inr(metrics.pendingPaymentsPaisa)} tone="amber"/>
        <AdminMetric icon={FileText} label="Invoices" value={metrics.issuedInvoices} hint={`${metrics.voidInvoices} void`} tone="blue"/>
      </section>
      <section className="admin-panel">
        <header><div><h2>Recent creators</h2><p>Newest accounts registered on the platform.</p></div><Link to="/admin/creators">View all</Link></header>
        <div className="admin-list-table admin-recent-table">
          <div className="admin-list-head"><span>Creator</span><span>Onboarding</span><span>Account</span><span>Joined</span></div>
          {recentCreators.map((creator) => <Link to={`/admin/creators/${creator.uid}`} className="admin-list-row" key={creator.uid}><span className="admin-person"><i>{creator.displayName?.[0]?.toUpperCase() || 'C'}</i><b>{creator.displayName || 'Unnamed creator'}<small>{creator.email}</small></b></span><span>{creator.onboardingCompleted ? 'Complete' : 'Incomplete'}</span><span><AdminStatus value={creator.accountStatus || 'Active'}/></span><span>{shortDate(creator.createdAt)}</span></Link>)}
          {!recentCreators.length && <div className="admin-empty-row">No creator accounts yet.</div>}
        </div>
      </section>
    </div>
  );
}
