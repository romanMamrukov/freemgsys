import React, { useEffect, useState } from 'react';
import api from '../api';
import { DownloadCloud, FileText } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data } = await api.get('/invoices');
        setInvoices(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const downloadInvoice = (id, filepath) => {
    // API endpoint returns the file
    window.open(`http://localhost:3001/api/invoices/${id}/download`, '_blank');
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-h1">Invoices</h2>
        <p className="text-muted">History of all generated invoices.</p>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="text-muted">No invoices generated yet.</p>
        </div>
      ) : (
        <div className="task-list">
          {invoices.map(invoice => (
            <div key={invoice.id} className="glass-panel text-main flex justify-between items-center" style={{ padding: '20px' }}>
              <div className="flex items-center gap-4">
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px' }}>Invoice #{invoice.id}</strong>
                  <p className="text-muted text-small flex gap-3 mt-1">
                    <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{invoice.total_hours.toFixed(2)} hrs</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <strong style={{ fontSize: '18px' }}>€{invoice.total_amount_eur.toFixed(2)}</strong>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => downloadInvoice(invoice.id, invoice.pdf_filepath)}
                  title="Download PDF"
                >
                  <DownloadCloud size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
