import { ArrowLeft, CalendarDays, CheckCircle2, Play } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import TaskCard from '../components/TaskCard';
import { useApp } from '../context/useApp';
import { TASK_STATUS } from '../lib/storage';

export default function TodayPage() {
  const { state, moveTask, startTask, completeTask } = useApp();
  const tasks = state.tasks.filter((task) => task.status === TASK_STATUS.TODAY);

  return (
    <>
      <PageHeader
        eyebrow="Focus"
        title="Today"
        description="A short, deliberate queue for the work that matters now. Starting a task automatically pauses any other running task."
      />

      <section className="section-block">
        <div className="list-heading">
          <h2>Planned work</h2>
          <span>{tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
        </div>
        {tasks.length ? (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard task={task} key={task.id}>
                <button className="button small primary" type="button" onClick={() => startTask(task.id)}>
                  <Play size={15} fill="currentColor" /> Start
                </button>
                <button
                  className="button small secondary"
                  type="button"
                  onClick={() => completeTask(task.id, { totalMinutes: task.actualMinutes || task.estimatedMinutes })}
                  title="Uses the tracked time, or the estimate if no time has been tracked"
                >
                  <CheckCircle2 size={15} /> Complete
                </button>
                <button className="icon-button" type="button" aria-label={`Return ${task.title} to inbox`} onClick={() => moveTask(task.id, TASK_STATUS.INBOX)}>
                  <ArrowLeft size={16} />
                </button>
              </TaskCard>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Nothing planned for today"
            description="Move a task here from Inbox when you are ready to focus on it."
          />
        )}
      </section>
    </>
  );
}
