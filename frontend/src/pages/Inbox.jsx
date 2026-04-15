import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { RefreshCw, ArrowRight, Trash2, Upload } from 'lucide-react';

export default function InboxPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  
  const fileInputRef = useRef(null);

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

  const handleCreateManual = async () => {
    if (!manualTitle.trim()) return;
    try {
      await api.post('/tasks', { title: manualTitle, description: manualDesc, source: 'MANUAL' });
      setManualTitle('');
      setManualDesc('');
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

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
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSyncing('xml');
    try {
      const text = await file.text();
      await api.post('/integrations/jira-xml', { xmlData: text });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
  
  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
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
          <input 
            type="file" 
            accept=".xml" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileUpload}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={syncing === 'xml'}>
            {syncing === 'xml' ? <div className="loader" style={{width: 16, height: 16, borderWidth: 2}}></div> : <Upload size={16} />} 
            Import XML
          </button>
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

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 className="text-h2 mb-4" style={{ fontSize: '1.2rem' }}>Add Manual Task</h3>
        <div className="flex gap-4">
          <input 
            type="text" 
            className="input" 
            placeholder="Task Title" 
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass-bg)', color: 'var(--text)' }}
          />
          <input 
            type="text" 
            className="input" 
            placeholder="Description (optional)" 
            value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass-bg)', color: 'var(--text)' }}
          />
          <button className="btn btn-primary" onClick={handleCreateManual}>
            Add Task
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
              <div className="task-actions" style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-danger" style={{ padding: '8px' }} onClick={() => deleteTask(task.id)} title="Delete Task">
                  <Trash2 size={16} />
                </button>
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
