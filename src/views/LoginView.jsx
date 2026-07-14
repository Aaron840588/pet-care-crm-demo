import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Loader } from 'lucide-react';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      setError('Production authentication is disabled in public demo mode.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait for onAuthStateChanged in App.jsx to pick it up
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
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '400px',
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
          fontSize: '24px', 
          margin: '0 0 8px 0',
          color: '#111'
        }}>
          Authorized Access
        </h1>
        <p style={{
          color: 'var(--gray)',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          Kat's Pet-Sitting Services CRM
        </p>

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
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              backgroundColor: 'var(--lime-dark)',
              color: '#111',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
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
        </form>
      </div>
    </div>
  );
}
