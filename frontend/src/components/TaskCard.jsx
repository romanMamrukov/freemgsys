import { Clock3, UserRound } from 'lucide-react';

function formatDuration(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const mins = Math.round(total % 60);
  if (!hours) return `${mins}m`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export default function TaskCard({ task, children, selected, onSelect }) {
  return (
    <article className={`task-card${selected ? ' selected' : ''}`}>
      {onSelect && (
        <label className="task-checkbox" aria-label={`Select ${task.title}`}>
          <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} />
          <span />
        </label>
      )}
      <div className="task-content">
        <div className="task-heading">
          <div>
            <div className="task-reference">
              <span>{task.externalId || 'Manual task'}</span>
              {task.client && <span><UserRound size={12} /> {task.client}</span>}
            </div>
            <h3>{task.title}</h3>
          </div>
          <span className={`status-pill status-${task.status.toLowerCase()}`}>{task.status}</span>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-footer">
          <span><Clock3 size={14} /> Estimated {formatDuration(task.estimatedMinutes)}</span>
          {Number(task.actualMinutes) > 0 && <span>Tracked {formatDuration(task.actualMinutes)}</span>}
        </div>
      </div>
      {children && <div className="task-actions">{children}</div>}
    </article>
  );
}
