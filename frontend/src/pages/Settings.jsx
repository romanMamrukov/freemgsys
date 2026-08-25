import { useRef, useState } from 'react';
import { DatabaseBackup, Download, RotateCcw, Save, Upload } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/useApp';
import { createBackup, defaultSettings, parseBackup } from '../lib/storage';

function downloadBackup(state) {
  const blob = new Blob([createBackup(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `freemgsys-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { state, saveSettings, restoreState, resetWorkspace } = useApp();
  const [form, setForm] = useState(state.settings);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    saveSettings(form);
    setMessage('Settings saved in this browser.');
    setError('');
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = parseBackup(await file.text());
      if (!window.confirm('Replace all current tasks, invoices, and settings with this backup?')) return;
      restoreState(restored);
      setForm(restored.settings);
      setMessage(`Backup restored: ${restored.tasks.length} tasks and ${restored.invoices.length} invoices.`);
      setError('');
    } catch (importError) {
      setError(importError.message || 'The backup could not be imported.');
      setMessage('');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings & backup"
        description="Configure invoice details and keep a portable JSON backup. Nothing is sent to a server."
      />

      <form onSubmit={submit} className="settings-stack">
        <section className="panel settings-panel">
          <div className="panel-heading"><div><span className="eyebrow">Seller</span><h2>Your business details</h2></div></div>
          <div className="form-grid">
            <label className="field"><span>Name / company *</span><input value={form.sellerName} onChange={change('sellerName')} placeholder="Your name or company" /></label>
            <label className="field"><span>Registration number</span><input value={form.sellerRegistration} onChange={change('sellerRegistration')} /></label>
            <label className="field field-wide"><span>Address</span><input value={form.sellerAddress} onChange={change('sellerAddress')} placeholder="Street, city, postal code, country" /></label>
            <label className="field"><span>Email</span><input type="email" value={form.sellerEmail} onChange={change('sellerEmail')} /></label>
            <label className="field"><span>Phone</span><input value={form.sellerPhone} onChange={change('sellerPhone')} /></label>
            <label className="field"><span>Bank</span><input value={form.sellerBank} onChange={change('sellerBank')} /></label>
            <label className="field"><span>IBAN</span><input value={form.sellerIban} onChange={change('sellerIban')} /></label>
            <label className="field"><span>SWIFT / BIC</span><input value={form.sellerSwift} onChange={change('sellerSwift')} /></label>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="panel-heading"><div><span className="eyebrow">Default client</span><h2>Buyer details</h2></div></div>
          <div className="form-grid">
            <label className="field"><span>Name / company</span><input value={form.clientName} onChange={change('clientName')} placeholder="Used when a task has no client" /></label>
            <label className="field"><span>Registration number</span><input value={form.clientRegistration} onChange={change('clientRegistration')} /></label>
            <label className="field field-wide"><span>Address</span><input value={form.clientAddress} onChange={change('clientAddress')} /></label>
            <label className="field"><span>Email</span><input type="email" value={form.clientEmail} onChange={change('clientEmail')} /></label>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="panel-heading"><div><span className="eyebrow">Billing</span><h2>Invoice defaults</h2></div></div>
          <div className="form-grid form-grid-four">
            <label className="field"><span>Hourly rate</span><input type="number" min="0" step="0.01" value={form.hourlyRate} onChange={change('hourlyRate')} /></label>
            <label className="field"><span>Currency</span><select value={form.currency} onChange={change('currency')}><option>EUR</option><option>USD</option><option>GBP</option><option>SEK</option><option>NOK</option><option>DKK</option></select></label>
            <label className="field"><span>Tax rate (%)</span><input type="number" min="0" step="0.01" value={form.taxRate} onChange={change('taxRate')} /></label>
            <label className="field"><span>Payment terms (days)</span><input type="number" min="0" step="1" value={form.paymentTermsDays} onChange={change('paymentTermsDays')} /></label>
            <label className="field"><span>Invoice prefix</span><input value={form.invoicePrefix} onChange={change('invoicePrefix')} maxLength="12" /></label>
            <label className="field"><span>Next number</span><input type="number" min="1" step="1" value={form.nextInvoiceNumber} onChange={change('nextInvoiceNumber')} /></label>
            <label className="field field-wide"><span>Invoice notes</span><textarea rows="3" value={form.invoiceNotes} onChange={change('invoiceNotes')} placeholder="Thank you, payment reference, or legal note" /></label>
          </div>
        </section>

        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="sticky-save"><button className="button primary" type="submit"><Save size={17} /> Save settings</button></div>
      </form>

      <section className="panel backup-panel">
        <div className="backup-intro">
          <span className="empty-icon"><DatabaseBackup size={23} /></span>
          <div>
            <span className="eyebrow">Browser-only storage</span>
            <h2>Backup your workspace</h2>
            <p>Your {state.tasks.length} tasks, {state.invoices.length} invoices, and all settings live only in this browser profile. Export a backup regularly and before clearing browser data.</p>
          </div>
        </div>
        <div className="backup-actions">
          <button className="button secondary" type="button" onClick={() => downloadBackup(state)}><Download size={16} /> Export JSON</button>
          <button className="button secondary" type="button" onClick={() => fileInput.current?.click()}><Upload size={16} /> Import JSON</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
          <button className="button danger-button" type="button" onClick={() => {
            if (window.confirm('Delete all local tasks, invoices, and settings? Export a backup first if you may need them.')) {
              resetWorkspace();
              setForm({ ...defaultSettings });
              setMessage('Workspace reset.');
            }
          }}><RotateCcw size={16} /> Reset workspace</button>
        </div>
      </section>
    </>
  );
}
