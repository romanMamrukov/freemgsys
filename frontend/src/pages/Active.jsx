import { useEffect, useState } from 'react';
import { CheckCircle2, Pause, PlayCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/useApp';
import { elapsedMinutes, TASK_STATUS } from '../lib/storage';

function timerValue(minutes) {
  const seconds = Math.max(0, Math.floor(Number(minutes || 0) * 60));
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, mins, secs].map((part) => String(part).padStart(2, '0')).join(':');
}

function ActiveTask({ task, pauseTask, completeTask }) {
  const [now, setNow] = useState(0);
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState(task.comment || '');

  useEffect(() => {
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, [task]);

  const minutes = elapsedMinutes(task, now);

  const finish = (event) => {
    event.preventDefault();
    const enteredHours = hours.trim() === '' ? elapsedMinutes(task) / 60 : Number(hours);
    completeTask(task.id, {
      totalMinutes: Math.max(0, enteredHours || 0) * 60,
      comment,
    });
  };

  return (
    <div className="active-layout">
      <section className="panel timer-panel">
        <div className="task-reference">
          <span>{task.externalId || 'Manual task'}</span>
          {task.client && <span>{task.client}</span>}
        </div>
        <h2>{task.title}</h2>
        {task.description && <p>{task.description}</p>}
        <div className="timer" aria-live="off">{timerValue(minutes)}</div>
        <span className="timer-caption">hours · minutes · seconds</span>
        <button className="button secondary" type="button" onClick={() => pauseTask(task.id)}>
          <Pause size={17} fill="currentColor" /> Pause and return to Today
        </button>
      </section>

      <form className="panel completion-panel" onSubmit={finish}>
        <div className="panel-heading">
          <div><span className="eyebrow">Finish work</span><h2>Completion details</h2></div>
          <CheckCircle2 size={22} />
        </div>
        <label className="field">
          <span>Total billable hours</span>
          <input type="number" min="0" step="0.01" value={hours} onChange={(event) => setHours(event.target.value)} placeholder={(minutes / 60).toFixed(2)} />
          <small>Leave blank to use the live timer, or enter an adjusted total.</small>
        </label>
        <label className="field">
          <span>Work summary</span>
          <textarea rows="6" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What was delivered, tested, or agreed?" />
        </label>
        <button className="button primary full-width" type="submit">
          <CheckCircle2 size={17} /> Complete task
        </button>
      </form>
    </div>
  );
}

export default function ActivePage() {
  const { state, pauseTask, completeTask } = useApp();
  const task = state.tasks.find((item) => item.status === TASK_STATUS.ACTIVE);

  return (
    <>
      <PageHeader
        eyebrow="Time tracking"
        title="Active task"
        description="The timer is stored in this browser and continues correctly after a refresh or a closed tab."
      />

      {!task ? (
        <EmptyState
          icon={PlayCircle}
          title="No timer is running"
          description="Choose a task in Today and press Start. Only one timer can run at a time."
        />
      ) : <ActiveTask key={task.id} task={task} pauseTask={pauseTask} completeTask={completeTask} />}
    </>
  );
}
