import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Inbox, Calendar, PlayCircle, CheckCircle, FileText, Settings } from 'lucide-react';
import InboxPage from './pages/Inbox';
import TodayPage from './pages/Today';
import ActivePage from './pages/Active';
import CompletedPage from './pages/Completed';
import InvoicesPage from './pages/Invoices';
import SettingsPage from './pages/Settings';
import './index.css';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <div className="mb-4">
        <h1 className="text-h2" style={{ color: "var(--primary)" }}>IT Ops Console</h1>
      </div>
      
      <nav className="flex-col">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Inbox size={18} /> Inbox
        </NavLink>
        <NavLink to="/today" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Calendar size={18} /> Today
        </NavLink>
        <NavLink to="/active" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <PlayCircle size={18} /> Active Task
        </NavLink>
        <NavLink to="/completed" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <CheckCircle size={18} /> Completed
        </NavLink>
        <NavLink to="/invoices" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <FileText size={18} /> Invoices
        </NavLink>
      </nav>
      
      <div style={{ marginTop: 'auto' }}>
        <button 
          className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onClick={() => navigate('/settings')}
        >
          <Settings size={18} /> Settings
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<InboxPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/active" element={<ActivePage />} />
            <Route path="/completed" element={<CompletedPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
