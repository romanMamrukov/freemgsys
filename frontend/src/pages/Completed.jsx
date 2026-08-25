import { useMemo, useState } from 'react';
import { FilePlus2, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import TaskCard from '../components/TaskCard';
import { useApp } from '../context/useApp';
import { TASK_STATUS } from '../lib/storage';

function money(value, currency) {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(value);
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }
}

export default function CompletedPage() {
  const { state, updateTask, createInvoice } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const tasks = state.tasks.filter((task) => task.status === TASK_STATUS.COMPLETED);
  const selectedTasks = tasks.filter((task) => selected.includes(task.id));
  const totalHours = selectedTasks.reduce((sum, task) => sum + Number(task.actualMinutes || 0) / 60, 0);
  const projectedTotal = totalHours * Number(state.settings.hourlyRate || 0) * (1 + Number(state.settings.taxRate || 0) / 100);
  const selectedClients = useMemo(
    () => [...new Set(selectedTasks.map((task) => task.client.trim()).filter(Boolean))],
    [selectedTasks],
  );

  const toggle = (id, checked) => {
    setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
    setError('');
  };

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const invoice = createInvoice(selected);
      const { downloadInvoicePdf } = await import('../lib/pdf');
      await downloadInvoicePdf(invoice);
      setSelected([]);
      navigate('/invoices');
    } catch (generateError) {
      setError(generateError.message || 'Invoice could not be generated.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Billable work"
        title="Completed work"
        description="Review billable hours, select work for one client, and generate a PDF invoice entirely in your browser."
      />

      {tasks.length ? (
        <div className="billing-layout">
          <section className="section-block">
            <div className="list-heading">
              <h2>Ready to invoice</h2>
              <button
                className="text-button"
                type="button"
                onClick={() => setSelected(selected.length === tasks.length ? [] : tasks.map((task) => task.id))}
              >
                {selected.length === tasks.length ? 'Clear selection' : 'Select all'}
              </button>
            </div>
            <div className="task-list">
              {tasks.map((task) => (
                <TaskCard
                  task={task}
                  key={task.id}
                  selected={selected.includes(task.id)}
                  onSelect={(checked) => toggle(task.id, checked)}
                >
                  <label className="inline-field">
                    <span>Billable hours</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(Number(task.actualMinutes || 0) / 60).toFixed(2)}
                      onChange={(event) => updateTask(task.id, { actualMinutes: Math.max(0, Number(event.target.value) || 0) * 60 })}
                    />
                  </label>
                </TaskCard>
              ))}
            </div>
          </section>

          <aside className="panel invoice-summary">
            <span className="eyebrow">Invoice preview</span>
            <h2>{selected.length || 0} selected</h2>
            <dl>
              <div><dt>Billable time</dt><dd>{totalHours.toFixed(2)} h</dd></div>
              <div><dt>Hourly rate</dt><dd>{money(state.settings.hourlyRate, state.settings.currency)}</dd></div>
              {Number(state.settings.taxRate) > 0 && <div><dt>Tax</dt><dd>{state.settings.taxRate}%</dd></div>}
              <div className="summary-total"><dt>Estimated total</dt><dd>{money(projectedTotal, state.settings.currency)}</dd></div>
            </dl>
            {selectedClients.length > 1 && <p className="form-error">Select tasks for one client per invoice.</p>}
            {!state.settings.sellerName && <p className="form-note">Add your seller details in Settings before sending the invoice.</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button primary full-width" type="button" disabled={!selected.length || busy || selectedClients.length > 1} onClick={generate}>
              <FilePlus2 size={17} /> {busy ? 'Generating…' : 'Create & download PDF'}
            </button>
          </aside>
        </div>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No completed work yet"
          description="Complete a task to review its hours and turn it into an invoice."
        />
      )}
    </>
  );
}
