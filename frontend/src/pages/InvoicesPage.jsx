import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Download, FileText, IndianRupee, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { Button, EmptyState, Modal, PageHeader, Skeleton } from '@/components/ui';

async function download(invoice) {
  const response = await api.get(`/invoices/${invoice._id}/pdf`, {
    responseType: 'blob',
    params: { fresh: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${invoice.invoiceNumber}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function InvoicesPage() {
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api.get('/invoices')).data.data,
  });
  const remove = useMutation({
    mutationFn: (invoiceId) => api.delete(`/invoices/${invoiceId}`),
    onSuccess: () => {
      toast.success('Invoice deleted');
      setInvoiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  const visibleInvoices = deferredSearch
    ? data.filter((invoice) => [invoice.invoiceNumber, invoice.billTo?.name, invoice.billTo?.email]
      .some((value) => value?.toLowerCase().includes(deferredSearch)))
    : data;
  const issuedInvoices = data.filter((invoice) => invoice.status !== 'Void');
  const totalInvoicedPaisa = issuedInvoices.reduce((total, invoice) => total + invoice.totalPaisa, 0);
  const latestInvoice = issuedInvoices.reduce((latest, invoice) => {
    if (!latest) return invoice;
    return new Date(invoice.invoiceDate) > new Date(latest.invoiceDate) ? invoice : latest;
  }, null);

  async function downloadInvoice(invoice) {
    setDownloadingId(invoice._id);
    try {
      await download(invoice);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="page invoices-page">
      <PageHeader
        data-tour="invoice-workspace"
        eyebrow="DOCUMENTS"
        title="Invoices"
        description="Create, manage, and download invoices for your brand collaborations."
        action={<Link className="button button-primary button-md" to="/app/invoices/new"><Plus size={17}/> Create invoice</Link>}
      />

      {!isLoading && data.length > 0 && (
        <section className="invoice-overview" aria-label="Invoice overview">
          <article className="invoice-total-card">
            <span className="invoice-overview-icon"><IndianRupee size={19}/></span>
            <div><small>TOTAL INVOICED</small><strong>{inr(totalInvoicedPaisa, 2)}</strong><p>Across all generated invoices</p></div>
          </article>
          <article className="invoice-overview-stat">
            <span className="invoice-overview-icon violet"><ReceiptText size={19}/></span>
            <div><small>ISSUED DOCUMENTS</small><strong>{issuedInvoices.length}</strong><p>{data.length - issuedInvoices.length} void</p></div>
          </article>
          <article className="invoice-overview-stat">
            <span className="invoice-overview-icon blue"><CalendarDays size={19}/></span>
            <div><small>LATEST INVOICE</small><strong>{latestInvoice ? shortDate(latestInvoice.invoiceDate) : 'None'}</strong><p>{latestInvoice?.invoiceNumber}</p></div>
          </article>
        </section>
      )}

      {isLoading ? <Skeleton className="panel-skeleton"/> : (
        <section className="invoice-library">
          <header className="invoice-library-header">
            <div><h2>Invoice library</h2><p>Your downloadable invoice history.</p></div>
            <span>{visibleInvoices.length} {visibleInvoices.length === 1 ? 'invoice' : 'invoices'}</span>
          </header>

          {data.length > 0 && (
            <div className="invoice-search-wrap">
              <label className="invoice-search-box">
                <Search size={18}/>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice number, brand, or email..."/>
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear invoice search"><X size={16}/></button>}
              </label>
            </div>
          )}

          {visibleInvoices.length ? (
            <div className="invoice-list">
              <div className="invoice-list-head"><span>Invoice</span><span>Issued</span><span>Due</span><span>Amount</span><span>Actions</span></div>
              {visibleInvoices.map((invoice) => (
                <article key={invoice._id}>
                  <div className="invoice-document-cell">
                    <span className="invoice-document-icon"><FileText size={19}/><small>PDF</small></span>
                    <span><strong>{invoice.invoiceNumber}{invoice.status === 'Void' && <b className="invoice-void-mark">VOID</b>}</strong><small>For {invoice.billTo.name}</small><em>{invoice.billTo.email}</em></span>
                  </div>
                  <span className="invoice-date-cell"><small>Issued</small><strong>{shortDate(invoice.invoiceDate)}</strong></span>
                  <span className="invoice-date-cell"><small>Due</small><strong>{shortDate(invoice.dueDate)}</strong></span>
                  <span className="invoice-amount-cell"><small>Amount</small><strong>{inr(invoice.totalPaisa, 2)}</strong></span>
                  <div className="invoice-row-actions">
                    <Button variant="secondary" size="sm" loading={downloadingId === invoice._id} onClick={() => downloadInvoice(invoice)}><Download size={15}/> Download</Button>
                    {invoice.status !== 'Void' && <Button className="invoice-delete-button" variant="ghost" size="icon" onClick={() => setInvoiceToDelete(invoice)} aria-label={`Delete ${invoice.invoiceNumber}`} title="Delete invoice"><Trash2 size={17}/></Button>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="invoice-empty-wrap">
              <EmptyState
                icon={search ? Search : FileText}
                title={search ? 'No invoices found' : 'Create your first invoice'}
                description={search ? 'Try a different invoice number, brand, or email.' : 'Choose a collaboration, confirm the details, and download a polished PDF.'}
                action={search
                  ? <button className="button button-secondary button-md" type="button" onClick={() => setSearch('')}>Clear search</button>
                  : <Link className="button button-primary button-md" to="/app/invoices/new"><Plus size={16}/> Create invoice</Link>}
              />
            </div>
          )}

          <footer className="invoice-library-note"><ReceiptText size={15}/> Basic invoices for creator services. Tax is not calculated automatically.</footer>
        </section>
      )}

      <Modal
        open={Boolean(invoiceToDelete)}
        onClose={() => !remove.isPending && setInvoiceToDelete(null)}
        title="Delete this invoice?"
        description={invoiceToDelete ? `${invoiceToDelete.invoiceNumber} will be permanently deleted.` : ''}
        size="delete-confirm-modal"
      >
        <div className="confirm-body">
          <p>Deleted invoices cannot be recovered. If you need this invoice again, you will have to create a new one.</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setInvoiceToDelete(null)} disabled={remove.isPending}>Keep invoice</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(invoiceToDelete._id)}>Delete invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
