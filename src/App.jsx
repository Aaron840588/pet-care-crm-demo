import React, { useEffect, useState, lazy, Suspense } from 'react';
import { DataProvider, useData } from './store/DataContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { Wifi, WifiOff, Loader, X, LogOut } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

// ── LAZY LOAD all views — keeps initial bundle small ──────────────────────────
const LoginView          = lazy(() => import('./views/LoginView'));
const DashboardView      = lazy(() => import('./views/DashboardView'));
const ClientsView        = lazy(() => import('./views/ClientsView'));
const ScheduleView       = lazy(() => import('./views/ScheduleView'));
const KeysView           = lazy(() => import('./views/KeysView'));
const InvoiceView        = lazy(() => import('./views/InvoiceView'));
const InvoiceRecordsView = lazy(() => import('./views/InvoiceRecordsView'));
const EarningsView       = lazy(() => import('./views/EarningsView'));
const SettingsView       = lazy(() => import('./views/SettingsView'));
const ReportCardView     = lazy(() => import('./views/ReportCardView'));
const ErrandsView        = lazy(() => import('./views/ErrandsView'));

const ViewLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
    <Loader size={28} color="var(--lime-dark)" style={{ animation: 'spin 1s linear infinite' }} />
  </div>
);

function AppContent({ onLogout }) {
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [isMobileOpen, setMobileOpen]       = useState(false);
  const [offlineDismissed, setOfflineDismissed] = useState(false);
  const { loading, syncStatus } = useData();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 769px)');
    const handleChange = (event) => {
      if (event.matches) {
        setMobileOpen(false);
      }
    };

    handleChange(media);
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardView />;
      case 'clients':     return <ClientsView />;
      case 'schedule':    return <ScheduleView />;
      case 'keys':        return <KeysView />;
      case 'invoices':    return <InvoiceView />;
      case 'records':     return <InvoiceRecordsView />;
      case 'earnings':    return <EarningsView />;
      case 'report-card': return <ReportCardView />;
      case 'errands':     return <ErrandsView />;
      case 'settings':    return <SettingsView />;
      default:            return <DashboardView />;
    }
  };

  // ── Full-screen loading splash ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', gap: '16px',
        background: 'var(--light)', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ background: 'var(--lime)', borderRadius: '20px', padding: '20px' }}>
          <Loader size={36} color="var(--black)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700 }}>
          Kat's CRM 🐾
        </div>
        <p style={{ color: 'var(--gray)', fontSize: '13px' }}>Connecting to the cloud…</p>
      </div>
    );
  }

  const syncBg    = syncStatus === 'online' ? '#e6f7ed' : syncStatus === 'offline' ? '#fff4e0' : '#f0f0f0';
  const syncColor = syncStatus === 'online' ? 'var(--green)' : syncStatus === 'offline' ? 'var(--orange)' : 'var(--gray)';
  const showOfflineBanner = syncStatus === 'offline' && !offlineDismissed;

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={onLogout}
      />

      <div className="main-wrapper">
        {/* Offline Banner */}
        {showOfflineBanner && (
          <div className="offline-banner">
            <WifiOff size={15} />
            <span style={{ flex: 1 }}>You're offline — data cached locally, changes sync when internet returns.</span>
            <button
              className="offline-dismiss"
              onClick={() => setOfflineDismissed(true)}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <main className="main" id="main-content">
          {/* CB5: print-only wrapper — only #inv-print-area prints, not the form */}
          <ErrorBoundary key={activeTab}>
            <Suspense fallback={<ViewLoader />}>
              {renderView()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Desktop sync status pill — hidden on mobile */}
      <div className="sync-pill" style={{ background: syncBg, color: syncColor }}>
        {syncStatus === 'online'
          ? <><Wifi size={11} /> Live Sync</>
          : syncStatus === 'offline'
          ? <><WifiOff size={11} /> Offline</>
          : <><Loader size={11} /> Connecting…</>
        }
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 95 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    if (isDemo) {
      setTimeout(() => {
        setUser({ uid: 'demo-user', email: 'hello@kats-petsitting.demo' });
        setAuthLoading(false);
      }, 500);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isDemo]);

  // ── Register Service Worker + Schedule notifications ─────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered:', reg.scope);

        // Request notification permission once
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then((result) => {
            console.log('[Notif] Permission:', result);
          });
        }

        // Schedule today's visit reminder (once per day)
        if (Notification.permission === 'granted') {
          const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
          const lastNotified = localStorage.getItem('crm_last_notified');

          if (lastNotified !== today && navigator.serviceWorker.controller) {
            const hour = new Date().getHours();
            // Notify between 6 AM and 10 PM only
            if (hour >= 6 && hour < 22) {
              navigator.serviceWorker.ready.then((swReg) => {
                swReg.active?.postMessage({
                  type: 'SHOW_NOTIFICATION',
                  title: "🐾 Today's Pet Visits",
                  body: 'Good morning! Check your schedule for today\'s visits.',
                  tag: `daily-${today}`,
                });
                localStorage.setItem('crm_last_notified', today);
              });
            }
          }
        }
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100dvh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-main)' }}>
        <Loader size={32} color="var(--lime-dark)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={
        <div style={{ height: '100dvh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-main)' }}>
          <Loader size={32} color="var(--lime-dark)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      }>
        <LoginView />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <DataProvider>
        <ToastProvider>
          <AppContent onLogout={handleLogout} />
        </ToastProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}
