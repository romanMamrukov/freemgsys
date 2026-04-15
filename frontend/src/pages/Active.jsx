import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { CheckCircle, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';

export default function ActivePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [timers, setTimers] = useState({}); // taskId -> elapsed seconds
  
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const fetchActiveTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks?status=IN_PROGRESS');
      setTasks(data);
      
      const newTimers = {};
      const savedRunningTaskId = localStorage.getItem('activeTaskId');
      const savedStartTime = localStorage.getItem('activeTaskStartTime');
      
      let foundRunning = false;
      
      data.forEach(task => {
        const dbSeconds = task.actual_time * 60;
        if (savedRunningTaskId == task.id && savedStartTime) {
          const diff = Math.floor((Date.now() - parseInt(savedStartTime, 10)) / 1000);
          newTimers[task.id] = dbSeconds + diff; // Should technically just be (Date.now - time) handled by logic
          // Let's just set the exact diff correctly
          newTimers[task.id] = diff;
          setActiveTaskId(task.id);
          foundRunning = true;
        } else {
          newTimers[task.id] = dbSeconds;
        }
      });
      
      if (!foundRunning) {
        setActiveTaskId(null);
        localStorage.removeItem('activeTaskId');
        localStorage.removeItem('activeTaskStartTime');
      }
      
      setTimers(newTimers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTasks();
  }, []);

  useEffect(() => {
    if (activeTaskId) {
      intervalRef.current = setInterval(() => {
        const savedStartTime = localStorage.getItem('activeTaskStartTime');
        if (savedStartTime) {
          const diff = Math.floor((Date.now() - parseInt(savedStartTime, 10)) / 1000);
          setTimers(prev => ({
            ...prev,
            [activeTaskId]: diff
          }));
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeTaskId]);

  useEffect(() => {
    // Auto-save time every minute for active task
    if (activeTaskId && timers[activeTaskId] > 0 && timers[activeTaskId] % 60 === 0) {
       api.put(`/tasks/${activeTaskId}/time`, { actual_time: timers[activeTaskId] / 60 }).catch(console.error);
    }
  }, [timers, activeTaskId]);

  const toggleTimer = async (id) => {
    if (activeTaskId === id) {
      // Pause current
      setActiveTaskId(null);
      localStorage.removeItem('activeTaskId');
      localStorage.removeItem('activeTaskStartTime');
      await api.put(`/tasks/${id}/time`, { actual_time: timers[id] / 60 }).catch(console.error);
    } else {
      // Pause previously running one if exists
      if (activeTaskId) {
        await api.put(`/tasks/${activeTaskId}/time`, { actual_time: timers[activeTaskId] / 60 }).catch(console.error);
      }
      // Start new one
      setActiveTaskId(id);
      localStorage.setItem('activeTaskId', id);
      localStorage.setItem('activeTaskStartTime', Date.now() - (timers[id] * 1000));
    }
  };

  const completeTask = async (id) => {
    try {
      if (activeTaskId === id) {
        localStorage.removeItem('activeTaskId');
        localStorage.removeItem('activeTaskStartTime');
        setActiveTaskId(null);
      }
      
      const seconds = timers[id] || 0;
      const minutes = seconds / 60;
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      const finalTime = roundedMinutes === 0 ? 15 : roundedMinutes; // minimum 15 mins
      
      await api.put(`/tasks/${id}/time`, { actual_time: finalTime });
      await api.put(`/tasks/${id}/status`, { status: 'COMPLETED' });
      
      const updatedTasks = tasks.filter(t => t.id !== id);
      setTasks(updatedTasks);
      
      if (updatedTasks.length === 0) {
        navigate('/completed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this active task?")) return;
    try {
      if (activeTaskId === id) {
        localStorage.removeItem('activeTaskId');
        localStorage.removeItem('activeTaskStartTime');
        setActiveTaskId(null);
      }
      
      await api.delete(`/tasks/${id}`);
      const updatedTasks = tasks.filter(t => t.id !== id);
      setTasks(updatedTasks);
      
      if (updatedTasks.length === 0) {
        navigate('/inbox');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (totalSeconds) => {
    const s = Math.max(0, totalSeconds || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>;
  }

  if (tasks.length === 0) {
    return (
      <div>
        <h2 className="text-h1 mb-4">Active Tasks</h2>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="text-muted">No active tasks. Start a task from Today's view.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-h1">Active Tasks Queue</h2>
        <p className="text-muted">Multi-task mode. Track your time down to the second across multiple assignments.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tasks.map(task => {
          const isRunning = activeTaskId === task.id;
          return (
            <div key={task.id} className="glass-panel items-center flex-col justify-center text-center" style={{ padding: '30px 20px', border: isRunning ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <span className={`badge ${isRunning ? 'badge-progress' : 'badge-inbox'} mb-4`}>
                {isRunning ? 'IN PROGRESS' : 'PAUSED'}
              </span>
              <h3 className="text-h2" style={{ marginBottom: '8px', fontSize: '1.25rem' }}>{task.title}</h3>
              <p className="text-muted mb-4">{task.description}</p>
              
              <textarea 
                className="input" 
                placeholder="Task comment or work log..."
                defaultValue={task.comment || ''}
                onBlur={(e) => api.put(`/tasks/${task.id}`, { comment: e.target.value }).catch(console.error)}
                style={{ width: '100%', maxWidth: '450px', minHeight: '80px', marginBottom: '16px', padding: '10px', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              
              <div className="timer-display" style={{ fontSize: '2.5rem', marginBottom: '16px', color: isRunning ? 'var(--primary)' : 'var(--text-light)' }}>
                {formatTime(timers[task.id])}
              </div>
              
              <div className="flex gap-4 justify-center mt-4">
                <button className="btn btn-danger" style={{ padding: '12px 16px', fontSize: '14px' }} onClick={() => deleteTask(task.id)} title="Delete Task">
                  <Trash2 size={18} />
                </button>
                <button className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '12px 24px', fontSize: '14px' }} onClick={() => toggleTimer(task.id)}>
                  {isRunning ? <><PauseCircle size={18} /> Pause</> : <><PlayCircle size={18} /> Start</>}
                </button>
                
                <button className="btn btn-success" style={{ padding: '12px 24px', fontSize: '14px' }} onClick={() => completeTask(task.id)}>
                  <CheckCircle size={18} /> Complete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
