import React, { useEffect, useState } from 'react';
import api from '../api';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompletedPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks?status=COMPLETED');
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

  const toggleSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const generateInvoice = async () => {
    if (selectedTasks.size === 0) return;
    setGenerating(true);
    try {
      await api.post('/invoices/generate', { task_ids: Array.from(selectedTasks) });
      navigate('/invoices');
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const totalSelectedMinutes = tasks
    .filter(t => selectedTasks.has(t.id))
    .reduce((sum, t) => sum + t.actual_time, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-h1">Completed Tasks</h2>
          <p className="text-muted">Select completed tasks to generate an invoice.</p>
        </div>
        
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <strong style={{ display: 'block' }}>{(totalSelectedMinutes / 60).toFixed(2)} hrs selected</strong>
              <span className="text-muted text-small">€{((totalSelectedMinutes / 60) * 50).toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" onClick={generateInvoice} disabled={generating}>
              {generating ? <div className="loader" style={{width: 16, height: 16, borderWidth: 2}}></div> : <FileText size={16} />} 
              Generate Invoice
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="text-muted">No completed tasks ready to be invoiced.</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="glass-panel task-card" 
              style={{ cursor: 'pointer', border: selectedTasks.has(task.id) ? '1px solid var(--primary)' : '' }}
              onClick={() => toggleSelection(task.id)}
            >
              <div className="flex items-center gap-4 task-info">
                <input 
                  type="checkbox" 
                  className="custom-checkbox" 
                  checked={selectedTasks.has(task.id)} 
                  readOnly 
                />
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="badge badge-completed">COMPLETED</span>
                    <strong>{task.title}</strong>
                  </div>
                  <p className="text-muted text-small">Logged: {(task.actual_time / 60).toFixed(2)} hrs</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
