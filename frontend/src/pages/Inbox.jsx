import React, { useEffect, useState } from 'react';
import api from '../api';
import { RefreshCw, ArrowRight } from 'lucide-react';

export default function InboxPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks?status=INBOX');
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

  const [syncing, setSyncing] = useState(null);

  const handleSync = async (source) => {
    setSyncing(source);
    try {
      await api.post(`/integrations/${source}`);
      await fetchTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
    }
  };

  const planTask = async (id) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: 'PLANNED' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-h1">Inbox</h2>
          <p className="text-muted">Review and plan incoming tasks from Jira and Gmail.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => handleSync('gmail')} disabled={syncing === 'gmail'}>
            {syncing === 'gmail' ? <div className="loader" style={{width: 16, height: 16, borderWidth: 2}}></div> : <RefreshCw size={16} />} 
            Sync Gmail
          </button>
          <button className="btn btn-secondary" onClick={() => handleSync('jira')} disabled={syncing === 'jira'}>
            {syncing === 'jira' ? <div className="loader" style={{width: 16, height: 16, borderWidth: 2}}></div> : <RefreshCw size={16} />} 
            Sync Jira
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="text-muted">Inbox is empty. Sync to fetch new tasks.</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className="glass-panel task-card" style={{ padding: '20px' }}>
              <div className="task-info">
                <div className="flex items-center gap-3 mb-1">
                  <span className="badge badge-inbox">{task.source}</span>
                  <strong style={{ fontSize: '16px' }}>{task.title}</strong>
                </div>
                <p className="text-muted text-small">{task.description || "No description provided."}</p>
              </div>
              <div className="task-actions">
                <button className="btn btn-primary" onClick={() => planTask(task.id)}>
                  Plan Task <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
