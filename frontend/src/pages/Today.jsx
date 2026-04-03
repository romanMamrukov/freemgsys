import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PlayCircle } from 'lucide-react';

export default function TodayPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks?status=PLANNED');
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const totalPlannedMinutes = tasks.reduce((sum, t) => sum + t.estimated_time, 0);

  const startTask = async (id) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: 'IN_PROGRESS' });
      navigate('/active');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-h1">Today's Plan</h2>
        <p className="text-muted">
          Total estimated time: {(totalPlannedMinutes / 60).toFixed(1)} hours (Cap is 6-8h)
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="text-muted">No tasks planned for today. Go to the Inbox to plan some.</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className="glass-panel task-card">
              <div className="task-info">
                <div className="flex items-center gap-3 mb-1">
                  <span className="badge badge-planned">PLANNED</span>
                  <strong>{task.title}</strong>
                </div>
                <p className="text-muted text-small">Estimated: {task.estimated_time} mins</p>
              </div>
              <div className="task-actions">
                <button className="btn btn-primary" onClick={() => startTask(task.id)}>
                  <PlayCircle size={16} /> Start
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
