import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Inbox,
  PlayCircle,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from './context/useApp';
import { TASK_STATUS } from './lib/storage';
import InboxPage from './pages/Inbox';
import TodayPage from './pages/Today';
import ActivePage from './pages/Active';
import CompletedPage from './pages/Completed';
import InvoicesPage from './pages/Invoices';
import SettingsPage from './pages/Settings';

const navigation = [
  { to: '/', label: 'Inbox', icon: Inbox, status: TASK_STATUS.INBOX },
  { to: '/today', label: 'Today', icon: CalendarDays, status: TASK_STATUS.TODAY },
  { to: '/active', label: 'Active', icon: PlayCircle, status: TASK_STATUS.ACTIVE },
  { to: '/completed', label: 'Completed', icon: CheckCircle2, status: TASK_STATUS.COMPLETED },
  { to: '/invoices', label: 'Invoices', icon: FileText, invoiceCount: true },
];

const pageNames = {
  '/': 'Inbox',
  '/today': 'Today',
  '/active': 'Active task',
  '/completed': 'Completed work',
  '/invoices': 'Invoices',
  '/settings': 'Settings & backup',
};

function Navigation({ mobile = false }) {
  const { state } = useApp();
  return (
    <nav className={mobile ? 'mobile-nav' : 'sidebar-nav'} aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}>
      {navigation.map((item) => {
        const Icon = item.icon;
        const count = item.invoiceCount
          ? state.invoices.length
          : state.tasks.filter((task) => task.status === item.status).length;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
            {count > 0 && <span className="nav-count">{count}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Shell() {
  const { storageError } = useApp();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">IT</span>
          <div>
            <strong>Ops Console</strong>
            <span>Freelance workflow</span>
          </div>
        </div>
        <Navigation />
        <div className="sidebar-footer">
          <div className="local-badge">
            <ShieldCheck size={16} />
            <div>
              <strong>Private by default</strong>
              <span>Saved in this browser</span>
            </div>
          </div>
          <NavLink to="/settings" className={({ isActive }) => `nav-item settings-link${isActive ? ' active' : ''}`}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings & backup</span>
          </NavLink>
        </div>
      </aside>

      <div className="workspace">
        <header className="mobile-header">
          <div className="brand-block compact">
            <span className="brand-mark">IT</span>
            <strong>{pageNames[location.pathname] || 'Ops Console'}</strong>
          </div>
          <NavLink to="/settings" className="icon-button" aria-label="Open settings">
            <Settings size={19} />
          </NavLink>
        </header>
        {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
        <main className="page-container">
          <Routes>
            <Route path="/" element={<InboxPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/active" element={<ActivePage />} />
            <Route path="/completed" element={<CompletedPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <Navigation mobile />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
