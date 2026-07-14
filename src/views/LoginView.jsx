import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Loader, Play, ShieldAlert } from 'lucide-react';

export default function LoginView({ onDemoLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    if (isDemo) {
      setError('Production authentication is disabled in public demo mode.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--light)',
      padding: '24px',
      fontFamily: 'var(--font-body)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            height: '48px',
            width: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--lime-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111'
          }}>
            <Lock size={24} />
          </div>
        </div>
        
        <h1 style={{ 
          fontFamily: 'Playfair Display, serif', 
          fontSize: '26px', 
          margin: '0 0 4px 0',
          color: '#111',
          fontWeight: 700
        }}>
          Pet Care Operations CRM
        </h1>
        <p style={{
          color: 'var(--gray)',
          fontSize: '14px',
          marginBottom: '32px',
          fontWeight: 500
        }}>
          Portfolio Demo Sandbox 🐾
        </p>

        {isDemo && !showAdminLogin ? (
          /* PUBLIC DEMO LANDING SCREEN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: '#f7fee7',
              border: '1px solid #d9f99d',
              borderRadius: '12px',
              padding: '18px',
              textAlign: 'left',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#3f6212',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '15px' }}>🔒</span>
                <span><strong>No Account Required</strong>: Access is immediate. No sign-up, registration, or real credentials are needed.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '15px' }}>💾</span>
                <span><strong>In-Browser Isolation</strong>: All operational changes remain entirely inside local state and browser memory, resetting safely upon page refresh.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '15px' }}>🧼</span>
                <span><strong>Fictional Synthetic Data</strong>: Explore the schedule, clients, and report card builders using obviously fictional records.</span>
              </div>
            </div>

            <button
              onClick={onDemoLogin}
              style={{
                marginTop: '8px',
                backgroundColor: 'var(--lime-dark)',
                color: '#111',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Inter, sans-serif',
                transition: 'opacity 0.2s',
                height: '52px',
                boxShadow: '0 4px 12px rgba(180, 244, 98, 0.25)'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <Play size={18} fill="#111" /> Launch Public Demo
            </button>

            <button
              onClick={() => setShowAdminLogin(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gray)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '10px',
                fontWeight: 500
              }}
            >
              Show Authorized Admin Login (Production Only)
            </button>
          </div>
        ) : (
          /* DESIGN DEMONSTRATION LOGIN SCREEN */
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="fg" style={{ textAlign: 'left', marginBottom: 0 }}>
              <label>EMAIL</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
              />
            </div>

            <div className="fg" style={{ textAlign: 'left', marginBottom: 0 }}>
              <label>PASSWORD</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ 
                color: '#d06060', 
                fontSize: '13px', 
                backgroundColor: '#fff0f0', 
                padding: '12px', 
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textAlign: 'left'
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {isDemo && (
                <button
                  type="button"
                  onClick={onDemoLogin}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--lime-dark)',
                    color: '#111',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                    height: '48px'
                  }}
                >
                  Continue to Demo
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: isDemo ? '#e5e7eb' : 'var(--lime-dark)',
                  color: isDemo ? '#9ca3af' : '#111',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif',
                  height: '48px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Log In'}
              </button>
            </div>

            {isDemo && (
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: '10px'
                }}
              >
                ← Back to Demo Home
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
