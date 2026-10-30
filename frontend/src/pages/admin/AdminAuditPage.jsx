import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { api } from '@/services/api';
import { shortDate } from '@/lib/format';
import { AdminError, AdminPagination } from '@/features/admin/AdminComponents';
import { EmptyState, Skeleton } from '@/components/ui';

const actionLabel = (value) => value.split('.').map((part) => part.replaceAll('_', ' ')).join(' · ');

export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['admin', 'audit', page], queryFn: async () => (await api.get('/admin/audit-logs', { params: { page, limit: 25 } })).data });
  return <div className="admin-page">
    <header className="admin-page-heading"><div><span>Accountability</span><h1>Audit log</h1><p>An immutable history of every administrator change.</p></div></header>
    {query.isLoading && <div className="admin-panel admin-loading-list">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index}/>)}</div>}
    {query.isError && <AdminError retry={() => query.refetch()}/>} 
    {query.data && <section className="admin-panel admin-audit-panel">{query.data.data.length ? <div className="admin-audit-list">{query.data.data.map((entry) => <article key={entry._id}><i><ScrollText size={17}/></i><div><strong>{actionLabel(entry.action)}</strong><p>{entry.reason}</p><small>{entry.actorEmail || entry.actorUid} · {entry.targetType} · {entry.targetId}</small></div><time>{shortDate(entry.createdAt)}</time></article>)}</div> : <EmptyState icon={ScrollText} title="No admin changes yet" description="Actions taken in this workspace will appear here."/>}<AdminPagination meta={query.data.meta} onPage={setPage}/></section>}
  </div>;
}
