import { Download, FileText, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/useApp';

function money(value, currency) {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }
}

export default function InvoicesPage() {
  const { state, deleteInvoice } = useApp();

  const download = async (invoice) => {
    const { downloadInvoicePdf } = await import('../lib/pdf');
    await downloadInvoicePdf(invoice);
  };

  return (
    <>
      <PageHeader
        eyebrow="Documents"
        title="Invoices"
        description="Invoices are stored as immutable snapshots. Download the PDF again at any time, even after changing your settings."
      />

      {state.invoices.length ? (
        <div className="invoice-list">
          {state.invoices.map((invoice) => (
            <article className="panel invoice-card" key={invoice.id}>
              <div className="invoice-card-main">
                <span className="invoice-icon"><FileText size={20} /></span>
                <div>
                  <span className="eyebrow">{invoice.issueDate}</span>
                  <h2>{invoice.number}</h2>
                  <p>{invoice.buyer?.name || 'Client not specified'} · {invoice.lines.length} line{invoice.lines.length === 1 ? '' : 's'} · due {invoice.dueDate}</p>
                </div>
              </div>
              <div className="invoice-amount">
                <span>Total</span>
                <strong>{money(invoice.total, invoice.currency)}</strong>
              </div>
              <div className="invoice-actions">
                <button className="button secondary" type="button" onClick={() => download(invoice)}>
                  <Download size={16} /> Download PDF
                </button>
                <button className="icon-button danger" type="button" aria-label={`Delete invoice ${invoice.number}`} onClick={() => {
                  if (window.confirm(`Delete invoice ${invoice.number}? Its tasks will return to Completed.`)) deleteInvoice(invoice.id);
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Select completed tasks and generate your first professional PDF invoice."
        />
      )}
    </>
  );
}
