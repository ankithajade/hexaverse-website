import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Nav from '../../components/Nav';

/**
 * AdminAuthGate — wraps admin routes with Supabase auth + admin_users role check.
 * Renders `children` only when the user is logged in AND on the admin allowlist.
 * Passes `session` and `handleLogout` down via React context so child components
 * (AdminLayout) can surface the logged-in email and the log-out button.
 */

import { createContext, useContext } from 'react';

export const AdminSessionContext = createContext(null);
export const useAdminSession = () => useContext(AdminSessionContext);

export default function AdminAuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // Check auth session & admin status on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) checkAdminRole(session.user.email);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) checkAdminRole(session.user.email);
      else {
        setIsAdmin(false);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userEmail) => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (err) {
      console.warn('Admin check error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoginErr(error.message);
        return;
      }

      if (data?.session?.user?.email) {
        await checkAdminRole(data.session.user.email);
      }
    } catch (err) {
      setLoginErr(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-dim)' }}>Loading Console…</p>
      </div>
    );
  }

  // ── Login / Unauthorized ────────────────────────────────────────────────────
  if (!session || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '120px 16px 60px' }}>
        <Nav />
        <div style={{ maxWidth: '440px', margin: '0 auto', background: 'var(--bg-card)', padding: '36px 28px', borderRadius: '12px', border: '1px solid var(--bg-card-border)', boxShadow: '0 8px 32px rgba(4,36,43,0.1)' }}>
          <h2 style={{ fontFamily: 'var(--font-subheading)', fontSize: '1.5rem', marginBottom: '8px' }}>Admin Console</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '24px' }}>
            Internal management dashboard for HexaVerse CloudFest &apos;26 organizers.
          </p>

          {loginErr && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {loginErr}
            </div>
          )}

          {session && !isAdmin && (
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
              Logged in as {session.user.email}, but this account is not on the admin allowlist (<code>admin_users</code>).
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dbit.in"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>
            <button type="submit" className="btn-register" style={{ width: '100%', marginTop: '12px' }}>
              Log In to Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated — render children inside session context ──────────────────
  return (
    <AdminSessionContext.Provider value={{ session, handleLogout }}>
      {children}
    </AdminSessionContext.Provider>
  );
}
