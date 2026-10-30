import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, UsersRound } from 'lucide-react';
import { api } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { AdminError, AdminPagination, AdminStatus } from '@/features/admin/AdminComponents';
import { EmptyState, Select, Skeleton } from '@/components/ui';

export function AdminCreatorsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [onboarding, setOnboarding] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const params = { page, limit: 25, search: search || undefined, status: status || undefined, onboarding: onboarding || undefined, sort };
  const query = useQuery({ queryKey: ['admin', 'users', params], queryFn: async () => (await api.get('/admin/users', { params })).data });
  const change = (setter) => (event) => { setter(event.target.value); setPage(1); };
  return (
    <div className="admin-page">
      <header className="admin-page-heading"><div><span>Creator management</span><h1>Creators</h1><p>Search accounts, review activity, and manage access.</p></div></header>
      <section className="admin-filter-bar">
        <label className="admin-search"><Search size={18}/><input value={search} onChange={change(setSearch)} placeholder="Search name, email, or Instagram" aria-label="Search creators"/></label>
        <Select aria-label="Account status" value={status} onChange={change(setStatus)}><option value="">All accounts</option><option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Deletion Pending">Deletion pending</option></Select>
        <Select aria-label="Onboarding status" value={onboarding} onChange={change(setOnboarding)}><option value="">All onboarding</option><option value="complete">Complete</option><option value="incomplete">Incomplete</option></Select>
        <Select aria-label="Sort creators" value={sort} onChange={change(setSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name</option></Select>
      </section>
      {query.isLoading && <div className="admin-panel admin-loading-list">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index}/>)}</div>}
      {query.isError && <AdminError retry={() => query.refetch()}/>} 
      {query.data && <section className="admin-panel admin-creators-panel">
        {query.data.data.length ? <div className="admin-list-table admin-creators-table"><div className="admin-list-head"><span>Creator</span><span>Status</span><span>Collaborations</span><span>Deal value</span><span>Joined</span></div>{query.data.data.map((creator) => <Link className="admin-list-row" to={`/admin/creators/${creator.uid}`} key={creator.uid}><span className="admin-person"><i>{creator.displayName?.[0]?.toUpperCase() || 'C'}</i><b>{creator.displayName || 'Unnamed creator'}<small>{creator.email}{creator.instagramHandle ? ` · @${creator.instagramHandle.replace('@', '')}` : ''}</small></b></span><span><AdminStatus value={creator.accountStatus || 'Active'}/></span><span>{creator.summary.collaborations}</span><span>{inr(creator.summary.dealValuePaisa)}</span><span>{shortDate(creator.createdAt)}</span></Link>)}</div> : <EmptyState icon={UsersRound} title="No creators found" description="Try clearing one of the search filters."/>}
        <AdminPagination meta={query.data.meta} onPage={setPage}/>
      </section>}
    </div>
  );
}
