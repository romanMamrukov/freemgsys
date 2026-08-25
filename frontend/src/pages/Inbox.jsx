import { useState } from 'react';
import { ArrowRight, Inbox as InboxIcon, Plus, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import TaskCard from '../components/TaskCard';
import { useApp } from '../context/useApp';
import { TASK_STATUS } from '../lib/storage';

const initialForm = {
  title: '',
  client: '',
  externalId: '',
  description: '',
  estimatedHours: 1,
};

export default function InboxPage() {
  const { state, addTask, moveTask, deleteTask } = useApp();
  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const tasks = state.tasks.filter((task) => task.status === TASK_STATUS.INBOX);

  const submit = (event) => {
    event.preventDefault();
    try {
      addTask({
        ...form,
        estimatedMinutes: Math.round(Math.max(0, Number(form.estimatedHours) || 0) * 60),
      });
      setForm(initialForm);
      setFormOpen(false);
      setError('');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Capture"
        title="Inbox"
        description="Record new work before it disappears into calls, messages, or memory. Integrations are intentionally disabled in this browser-only edition."
        actions={(
          <button className="button primary" type="button" onClick={() => setFormOpen((value) => !value)}>
            <Plus size={17} /> New task
          </button>
        )}
      />

      {formOpen && (
        <form className="panel task-form" onSubmit={submit}>
          <div className="panel-heading">
            <div><span className="eyebrow">Manual entry</span><h2>Capture new work</h2></div>
            <button className="text-button" type="button" onClick={() => setFormOpen(false)}>Close</button>
          </div>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Task title *</span>
              <input
                autoFocus
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Prepare release verification report"
                required
              />
            </label>
            <label className="field">
              <span>Client</span>
              <input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} placeholder="Client or company" />
            </label>
            <label className="field">
              <span>Reference</span>
              <input value={form.externalId} onChange={(event) => setForm({ ...form, externalId: event.target.value })} placeholder="Ticket, PO, or project ID" />
            </label>
            <label className="field">
              <span>Estimated hours</span>
              <input type="number" min="0" step="0.25" value={form.estimatedHours} onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })} />
            </label>
            <label className="field field-wide">
              <span>Description</span>
              <textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Scope, acceptance criteria, or useful context" />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button primary" type="submit">Add to inbox</button>
            <button className="button secondary" type="button" onClick={() => setForm(initialForm)}>Clear</button>
          </div>
        </form>
      )}

      <section className="section-block">
        <div className="list-heading"><h2>Unplanned work</h2><span>{tasks.length} task{tasks.length === 1 ? '' : 's'}</span></div>
        {tasks.length ? (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard task={task} key={task.id}>
                <button className="button small primary" type="button" onClick={() => moveTask(task.id, TASK_STATUS.TODAY)}>
                  Plan today <ArrowRight size={15} />
                </button>
                <button className="icon-button danger" type="button" aria-label={`Delete ${task.title}`} onClick={() => {
                  if (window.confirm(`Delete “${task.title}”?`)) deleteTask(task.id);
                }}>
                  <Trash2 size={16} />
                </button>
              </TaskCard>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={InboxIcon}
            title="Inbox is clear"
            description="Create a task manually, then move it to Today when you are ready to work on it."
            action={<button className="button secondary" type="button" onClick={() => setFormOpen(true)}><Plus size={16} /> Add first task</button>}
          />
        )}
      </section>
    </>
  );
}
