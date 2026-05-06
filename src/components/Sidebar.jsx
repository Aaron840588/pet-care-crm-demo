import React from 'react';
import {
  LayoutDashboard, Users, CalendarDays, KeyRound,
  FileTerminal, FolderClosed, Settings, TrendingUp, LogOut, ClipboardList
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isMobileOpen, setMobileOpen, onLogout }) {
  const navItems = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
    { section: 'Manage' },
    { id: 'clients',  label: 'Clients',           icon: Users },
    { id: 'errands',  label: 'Errands & Pabili',  icon: ClipboardList },
    { id: 'schedule', label: 'Schedule',          icon: CalendarDays },
    { id: 'keys',     label: 'Key Tracker',       icon: KeyRound },
    { section: 'Billing' },
    { id: 'invoices', label: 'Invoice Builder',   icon: FileTerminal },
    { id: 'records',  label: 'Invoice Records',   icon: FolderClosed },
    { id: 'earnings', label: 'Earnings Summary',  icon: TrendingUp },
    { id: 'report-card', label: 'Visit Report Card', icon: ClipboardList },
    { section: 'System' },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  const handleNav = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <div className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
      <div className="sb-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Kat's Pet-sitting" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div>
            <div className="logo" style={{ fontSize: '18px' }}>Kat's <span>Pet-sitting</span></div>
            <div className="sub">Business Manager dY?_</div>
          </div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item, idx) =>
          item.section
            ? <div key={`sec-${idx}`} className="nav-section">{item.section}</div>
            : (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <div className="ic"><item.icon size={16} /></div>
                {item.label}
              </button>
            )
        )}
        
        <div className="nav-section" style={{ marginTop: 'auto' }}>Account</div>
        <button
          type="button"
          className="nav-item"
          onClick={onLogout}
          style={{ color: '#d06060' }}
        >
          <div className="ic"><LogOut size={16} color="#d06060" /></div>
          Sign Out
        </button>
      </nav>

      <div className="sb-footer">
        Kat's Pet-sitting Services<br />
        San Antonio, Los Baños, Laguna<br />
        GCash: 09952664451
      </div>
    </div>
  );
}
