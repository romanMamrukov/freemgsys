import React, { useState, useEffect } from 'react';
import api from '../api';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    invoiceFromName: '',
    myBusinessAddress: '',
    myContactDetails: '',
    myRegNumber: '',
    myPaymentInfo: '',
    invoiceToName: '',
    clientBusinessAddress: '',
    clientContactDetails: '',
    clientRegNumber: '',
    hourlyRate: '',
    gmailEmail: '',
    gmailAppPassword: '',
    jiraDomain: '',
    jiraEmail: '',
    jiraApiToken: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center" style={{ padding: '40px' }}><div className="loader"></div></div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-h1">Settings</h2>
          <p className="text-muted">Manage your invoicing details and integrations.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <div className="loader" style={{width: 16, height: 16, borderWidth: 2}}></div> : <Save size={16} />} 
          Save Changes
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px', background: 'var(--bg-card)', borderLeft: '4px solid var(--primary)', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Invoicing Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 'bold' }}>My Business Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Your / Company Name</label>
              <input 
                type="text" 
                name="invoiceFromName" 
                value={settings.invoiceFromName || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Registration Number</label>
              <input 
                type="text" 
                name="myRegNumber" 
                value={settings.myRegNumber || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Business Address</label>
              <textarea 
                name="myBusinessAddress" 
                value={settings.myBusinessAddress || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Contact Details (Email/Phone)</label>
              <textarea 
                name="myContactDetails" 
                value={settings.myContactDetails || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Payment Information (Bank, IBAN, Swift)</label>
              <textarea 
                name="myPaymentInfo" 
                value={settings.myPaymentInfo || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 'bold' }}>Client Details & Rate</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Client Name</label>
              <input 
                type="text" 
                name="invoiceToName" 
                value={settings.invoiceToName || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Client Registration Number</label>
              <input 
                type="text" 
                name="clientRegNumber" 
                value={settings.clientRegNumber || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Client Business Address</label>
              <textarea 
                name="clientBusinessAddress" 
                value={settings.clientBusinessAddress || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Client Contact Details</label>
              <textarea 
                name="clientContactDetails" 
                value={settings.clientContactDetails || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Hourly Rate (EUR)</label>
              <input 
                type="number" 
                name="hourlyRate" 
                value={settings.hourlyRate || ''} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Gmail Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 'bold' }}>Gmail Integration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Email Address</label>
              <input 
                type="text" 
                name="gmailEmail" 
                value={settings.gmailEmail || ''} 
                onChange={handleChange} 
                placeholder="you@gmail.com"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>App Password</label>
              <input 
                type="password" 
                name="gmailAppPassword" 
                value={settings.gmailAppPassword || ''} 
                onChange={handleChange} 
                placeholder="xxxx xxxx xxxx xxxx"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
          </div>
          <p className="text-muted text-small mt-2">Generate an App Password in your Google Account security settings.</p>
        </div>

        {/* Jira Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 'bold' }}>Jira Integration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Jira Workspace Domain</label>
              <input 
                type="text" 
                name="jiraDomain" 
                value={settings.jiraDomain || ''} 
                onChange={handleChange} 
                placeholder="https://your-domain.atlassian.net"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Jira Email Address</label>
              <input 
                type="text" 
                name="jiraEmail" 
                value={settings.jiraEmail || ''} 
                onChange={handleChange} 
                placeholder="you@company.com"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className="text-muted text-small" style={{ display: 'block', marginBottom: '8px' }}>Jira API Token</label>
              <input 
                type="password" 
                name="jiraApiToken" 
                value={settings.jiraApiToken || ''} 
                onChange={handleChange} 
                placeholder="Paste API token here"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
