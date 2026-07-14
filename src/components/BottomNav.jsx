import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, CalendarDays, TrendingUp,
  KeyRound, FileTerminal, FolderClosed, Settings,
  MoreHorizontal, X, ClipboardList, ShoppingCart, PawPrint
} from 'lucide-react';

// Primary 4 tabs always visible
const primary = [
  { id: 'dashboard', label: 'Today',    Icon: LayoutDashboard },
  { id: 'clients',   label: 'Clients',  Icon: Users },
  { id: 'schedule',  label: 'Schedule', Icon: CalendarDays },
  { id: 'earnings',  label: 'Earnings', Icon: TrendingUp },
];

// "More" drawer contents
const more = [
  { id: 'errands',     label: 'Errands & Pabili',   Icon: ShoppingCart },
  { id: 'own-pets',    label: 'Own Pets',           Icon: PawPrint },
  { id: 'keys',        label: 'Key Tracker',        Icon: KeyRound },
  { id: 'invoices',    label: 'Invoice Builder',    Icon: FileTerminal },
  { id: 'records',     label: 'Invoice Records',    Icon: FolderClosed },
  { id: 'report-card', label: 'Visit Report Card',  Icon: ClipboardList },
  { id: 'settings',    label: 'Settings & Backup',  Icon: Settings },
];

const moreIds = more.map(m => m.id);

export default function BottomNav({ activeTab, setActiveTab }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    window.matchMedia('(max-width: 768px)').matches
  );

  const goTo = (id) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  const moreIsActive = moreIds.includes(activeTab);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setDrawerOpen(false);
      }
    };

    handleChange(media);
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!drawerOpen || !isMobileViewport) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen, isMobileViewport]);

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && isMobileViewport && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 298 }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* More drawer */}
      {drawerOpen && isMobileViewport && (
        <div
          id="bottom-nav-more-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="More sections"
          style={{
          position: 'fixed', bottom: `calc(64px + var(--safe-bottom))`,
          left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', borderRadius: '20px',
          padding: '16px', width: 'calc(100vw - 32px)', maxWidth: '400px',
          zIndex: 299, boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#666', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>More Sections</span>
            <button type="button" aria-label="Close more sections" onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
          {more.map((item) => {
            const DrawerIcon = item.Icon;

            return (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '13px 16px', borderRadius: '12px', border: 'none',
                background: activeTab === item.id ? 'rgba(212,232,74,0.15)' : 'transparent',
                color: activeTab === item.id ? 'var(--lime)' : '#aaa',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px',
                fontWeight: activeTab === item.id ? 700 : 500,
                textAlign: 'left', width: '100%',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <DrawerIcon size={20} />
              {item.label}
            </button>
            );
          })}
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="bottom-nav">
        {primary.map((item) => {
          const NavIcon = item.Icon;

          return (
          <button
            key={item.id}
            type="button"
            className={`bn-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => goTo(item.id)}
          >
            <NavIcon size={20} />
            <span>{item.label}</span>
          </button>
          );
        })}
        {/* More button */}
        <button
          type="button"
          className={`bn-item ${moreIsActive ? 'active' : ''}`}
          onClick={() => setDrawerOpen(d => !d)}
          aria-controls="bottom-nav-more-drawer"
          aria-expanded={drawerOpen && isMobileViewport}
        >
          <MoreHorizontal size={20} />
          <span>{moreIsActive ? more.find(m => m.id === activeTab)?.label.split(' ')[0] : 'More'}</span>
        </button>
      </nav>
    </>
  );
}
