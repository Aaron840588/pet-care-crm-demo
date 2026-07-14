import React from 'react';
import {
  LayoutDashboard, Users, CalendarDays, KeyRound,
  FileTerminal, FolderClosed, Settings, TrendingUp, LogOut, ClipboardList, PawPrint
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isMobileOpen, setMobileOpen, onLogout }) {
  const navItems = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
    { section: 'Manage' },
    { id: 'clients',  label: 'Clients',           icon: Users },
    { id: 'errands',  label: 'Errands & Pabili',  icon: ClipboardList },
    { id: 'schedule', label: 'Schedule',          icon: CalendarDays },
    { id: 'own-pets', label: 'Own Pets',          icon: PawPrint },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Pet Care CRM" style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, borderRadius: '8px' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="logo" style={{ fontSize: '17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pet Care <span>Operations</span></div>
            <div className="sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Portfolio Demo 🐾</div>
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
        Pet Care Operations CRM<br />
        Portfolio Demo Sandbox<br />
        GCash: 0917-000-0000
      </div>
    </div>
  );
}
