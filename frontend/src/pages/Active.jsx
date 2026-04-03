import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { CheckCircle, PauseCircle, PlayCircle } from 'lucide-react';

export default function ActivePage() {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchActiveTask = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/tasks?status=IN_PROGRESS');
        if (data.length > 0) {
          setTask(data[0]);
          setElapsedSeconds(data[0].actual_time * 60); // actual_time is stored in minutes
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTask();
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  useEffect(() => {
    // Auto-save time every minute if running
    if (isRunning && elapsedSeconds > 0 && elapsedSeconds % 60 === 0 && task) {
       api.put(`/tasks/${task.id}/time`, { actual_time: elapsedSeconds / 60 }).catch(console.error);
    }
  }, [elapsedSeconds, isRunning, task]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (isRunning && task) {
      // If we pause, immediately save time
      api.put(`/tasks/${task.id}/time`, { actual_time: elapsedSeconds / 60 }).catch(console.error);
    }
  };

  const completeTask = async () => {
    if (!task) return;
    try {
      // Save final time, round up to 15 min increments as requested
      const minutes = elapsedSeconds / 60;
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      const finalTime = roundedMinutes === 0 ? 15 : roundedMinutes; // minimum 15 mins
      
      await api.put(`/tasks/${task.id}/time`, { actual_time: finalTime });
      await api.put(`/tasks/${task.id}/status`, { status: 'COMPLETED' });
      navigate('/completed');
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>;
  }

  if (!task) {
    return (
      <div>
        <h2 className="text-h1 mb-4">Active Task</h2>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="text-muted">No active task. Start a task from Today's view.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-h1">Active Task</h2>
        <p className="text-muted">Focus mode. Track your time down to the second.</p>
      </div>

      <div className="glass-panel items-center flex-col justify-center text-center" style={{ padding: '60px 20px' }}>
        <span className="badge badge-progress mb-4">IN PROGRESS</span>
        <h3 className="text-h2" style={{ marginBottom: '8px' }}>{task.title}</h3>
        <p className="text-muted mb-4">{task.description}</p>
        
        <div className="timer-display">
          {formatTime(elapsedSeconds)}
        </div>
        
        <div className="flex gap-4 justify-center mt-4" style={{marginTop: '32px'}}>
          <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '16px' }} onClick={toggleTimer}>
            {isRunning ? <><PauseCircle /> Pause</> : <><PlayCircle /> Start</>}
          </button>
          
          <button className="btn btn-success" style={{ padding: '12px 24px', fontSize: '16px' }} onClick={completeTask}>
            <CheckCircle /> Complete
          </button>
        </div>
        
        <p className="text-muted text-small mt-4" style={{ marginTop: '32px' }}>
          Time will be automatically rounded to nearest 15 minutes upon completion.
        </p>
      </div>
    </div>
  );
}
