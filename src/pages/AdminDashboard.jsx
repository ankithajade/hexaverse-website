import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // Dashboard state
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [workshops, setWorkshops] = useState([]);
  const [teams, setTeams] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // Modal / Action states
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'audit_log'
  const [editItem, setEditItem] = useState(null); // { type: 'workshop'|'team', data: object }
  const [overrideModal, setOverrideModal] = useState(null); // { team: object }
  const [overrideReason, setOverrideReason] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Check auth session & admin status
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

      if (data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
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

  // Fetch admin dashboard data
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, selectedEvent]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      // 1. Events list
      const { data: evs } = await supabase.from('events').select('*').order('created_at');
      setEvents(evs || []);

      // 2. Workshops
      let wQuery = supabase.from('workshop_registrations').select('*').order('created_at', { ascending: false });
      if (selectedEvent !== 'all' && selectedEvent.endsWith('-workshop')) {
        wQuery = wQuery.eq('event_slug', selectedEvent);
      }
      const { data: wData } = await wQuery;
      setWorkshops(wData || []);

      // 3. Teams with members and payment
      let tQuery = supabase.from('teams').select('*, team_members(*), payments(*)').order('created_at', { ascending: false });
      if (selectedEvent !== 'all' && !selectedEvent.endsWith('-workshop')) {
        tQuery = tQuery.eq('event_slug', selectedEvent);
      }
      const { data: tData } = await tQuery;
      setTeams(tData || []);

      // 4. Audit logs
      const { data: logs } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // ── CSV Export ────────────────────────────────────────────────────────────

  const handleExportCSV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Try Edge Function export
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-csv${selectedEvent !== 'all' ? `?event_slug=${selectedEvent}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedEvent}_participants.csv`;
        a.click();
        return;
      }
    } catch (err) {
      console.warn('Edge Function CSV export failed, using client fallback', err);
    }

    // Client CSV Export Fallback
    let csvContent = 'Type,Event Slug,ID,Name/Team,USN/Lead,Email,Phone,Payment Status,Created At\n';
    workshops.forEach((w) => {
      csvContent += `"Workshop","${w.event_slug}","${w.id}","${w.name}","${w.usn || ''}","${w.email}","${w.phone}","confirmed","${w.created_at}"\n`;
    });
    teams.forEach((t) => {
      const lead = t.team_members?.find((m) => m.is_lead) || t.team_members?.[0];
      csvContent += `"Team","${t.event_slug}","${t.id}","${t.team_name}","${lead?.usn || ''}","${lead?.email || ''}","${lead?.phone || ''}","${t.payment_status}","${t.created_at}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvent}_export.csv`;
    a.click();
  };

  // ── Manual Payment Verification Override ──────────────────────────────

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      setActionErr('Reason text is required for manual payment verification override');
      return;
    }
    setActionErr('');

    try {
      const team = overrideModal.team;
      const adminEmail = session?.user?.email || 'admin';

      // 1. Update team payment status to success
      const { error: teamErr } = await supabase
        .from('teams')
        .update({ payment_status: 'success' })
        .eq('id', team.id);

      if (teamErr) throw teamErr;

      // 2. Create or update payments record
      if (team.payment_ref) {
        await supabase
          .from('payments')
          .update({
            status: 'success',
            gateway: 'manual_override',
            verified_at: new Date().toISOString(),
          })
          .eq('id', team.payment_ref);
      } else {
        await supabase.from('payments').insert({
          registration_type: 'team',
          registration_id: team.id,
          amount_expected: team.team_size * 50,
          amount_paid: team.team_size * 50,
          status: 'success',
          gateway: 'manual_override',
          verified_at: new Date().toISOString(),
        });
      }

      // 3. Log into admin_audit_log
      await supabase.from('admin_audit_log').insert({
        admin_email: adminEmail,
        action: 'manual_payment_override',
        table_name: 'teams',
        record_id: team.id,
        before: { payment_status: team.payment_status },
        after: { payment_status: 'success', override: true },
        reason: overrideReason.trim(),
      });

      setOverrideModal(null);
      setOverrideReason('');
      fetchDashboardData();
    } catch (err) {
      setActionErr(err.message || 'Override failed');
    }
  };

  // ── Edit Registration Save ──────────────────────────────────────────────

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionErr('');
    try {
      const adminEmail = session?.user?.email || 'admin';
      const { type, data } = editItem;

      if (type === 'workshop') {
        const { error } = await supabase
          .from('workshop_registrations')
          .update({
            name: data.name,
            usn: data.usn,
            email: data.email,
            phone: data.phone,
            semester: Number(data.semester),
            status: data.status,
          })
          .eq('id', data.id);

        if (error) throw error;

        await supabase.from('admin_audit_log').insert({
          admin_email: adminEmail,
          action: 'edit_registration',
          table_name: 'workshop_registrations',
          record_id: data.id,
          after: data,
          reason: 'Admin updated workshop registration details',
        });
      } else if (type === 'team') {
        const { error } = await supabase
          .from('teams')
          .update({
            team_name: data.team_name,
            payment_status: data.payment_status,
          })
          .eq('id', data.id);

        if (error) throw error;

        await supabase.from('admin_audit_log').insert({
          admin_email: adminEmail,
          action: 'edit_registration',
          table_name: 'teams',
          record_id: data.id,
          after: data,
          reason: 'Admin updated team details',
        });
      }

      setEditItem(null);
      fetchDashboardData();
    } catch (err) {
      setActionErr(err.message || 'Failed to save edits');
    }
  };

  // Compute Statistics
  const totalWorkshops = workshops.length;
  const totalTeams = teams.length;
  const paidTeams = teams.filter((t) => t.payment_status === 'success').length;
  const totalRevenue = teams
    .filter((t) => t.payment_status === 'success')
    .reduce((sum, t) => sum + (t.team_size * (t.event_slug === 'treasure-hunt' ? 80 : 50)), 0);

  // Filtered data for table
  const filteredWorkshops = workshops.filter((w) =>
    searchQuery
      ? w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.usn?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const filteredTeams = teams.filter((t) =>
    searchQuery
      ? t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.team_members?.some((m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.usn.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  );

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Console...</p>
      </div>
    );
  }

  // ── Unauthenticated / Unauthorized Login View ──────────────────────────────
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
              Logged in as {session.user.email}, but this account is not on the admin allowlist (`admin_users`).
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

  // ── Authenticated Admin Dashboard View ────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '100px', paddingBottom: '60px' }}>
      <Nav />
      <div className="container">
        {/* Console Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="section-label">Ops Console</div>
            <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: 0 }}>HexaVerse Admin Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{session.user.email}</span>
            <button className="btn-details" onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registrations</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{totalWorkshops + totalTeams}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-display)' }}>₹{totalRevenue}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Free Workshop Attendees</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>{totalWorkshops}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', padding: '20px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Paid Teams (Success)</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)', fontFamily: 'var(--font-display)' }}>{paidTeams} / {totalTeams}</div>
          </div>
        </div>

        {/* Filter Controls & CSV Export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '220px' }}
            >
              <option value="all">All Events (Overview)</option>
              <optgroup label="Workshops (Free)">
                <option value="aiml-workshop">AI & ML Workshop</option>
                <option value="aids-workshop">AI & DS Workshop</option>
                <option value="cse-workshop">CSE Workshop</option>
                <option value="ise-workshop">ISE Workshop</option>
                <option value="ece-workshop">ECE Workshop</option>
                <option value="eee-workshop">EEE Workshop</option>
              </optgroup>
              <optgroup label="Signature Events (₹50/head)">
                <option value="aiml-event">AI & ML Signature Event</option>
                <option value="aids-event">AI & DS Signature Event</option>
                <option value="cse-event">CSE Signature Event</option>
                <option value="ise-event">ISE Signature Event</option>
                <option value="ece-event">ECE Signature Event</option>
                <option value="eee-event">EEE Signature Event</option>
              </optgroup>
              <optgroup label="Mega Events">
                <option value="treasure-hunt">Treasure Hunt (₹80/head)</option>
              </optgroup>
            </select>

            <input
              type="text"
              placeholder="Search by name, USN, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: 'auto', minWidth: '240px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={`btn-details ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('registrations')}
            >
              Registrations
            </button>
            <button
              className={`btn-details ${activeTab === 'audit_log' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit_log')}
            >
              Audit Log ({auditLogs.length})
            </button>
            <button className="btn-register" onClick={handleExportCSV}>
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* ── Table View: Registrations ── */}
        {activeTab === 'registrations' && (
          <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--bg-card-border)' }}>
            {loadingData ? (
              <p style={{ padding: '32px', textAlign: 'center' }}>Loading registrations...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-alt)', textAlign: 'left', borderBottom: '1px solid var(--bg-card-border)' }}>
                    <th style={{ padding: '14px 16px' }}>Event</th>
                    <th style={{ padding: '14px 16px' }}>Participant / Team</th>
                    <th style={{ padding: '14px 16px' }}>Lead Contact</th>
                    <th style={{ padding: '14px 16px' }}>Members / Size</th>
                    <th style={{ padding: '14px 16px' }}>Payment Status</th>
                    <th style={{ padding: '14px 16px' }}>Registered At</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Workshop rows */}
                  {(selectedEvent === 'all' || selectedEvent.endsWith('-workshop')) &&
                    filteredWorkshops.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--cyan)' }}>{w.event_slug}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <strong>{w.name}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>USN: {w.usn || 'Sem 1'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div>{w.email}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{w.phone}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>Sem {w.semester} (Individual)</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                            FREE / CONFIRMED
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(w.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            className="btn-details"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => setEditItem({ type: 'workshop', data: w })}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}

                  {/* Team rows */}
                  {(selectedEvent === 'all' || !selectedEvent.endsWith('-workshop')) &&
                    filteredTeams.map((t) => {
                      const lead = t.team_members?.find((m) => m.is_lead) || t.team_members?.[0];
                      const isManual = t.payments?.gateway === 'manual_override' || t.payment_ref === null;

                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--orange)' }}>{t.event_slug}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <strong>{t.team_name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Team ID: {t.id.slice(0, 8)}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div>{lead?.name} ({lead?.usn})</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lead?.email} · {lead?.phone}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <strong>{t.team_size} members</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {t.team_members?.map((m) => m.name).join(', ')}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {t.payment_status === 'success' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-block' }}>
                                  ✓ PAID SUCCESS
                                </span>
                                {isManual && (
                                  <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#d97706', border: '1px solid #f59e0b', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                    ⚠️ MANUAL OVERRIDE
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                                PENDING / FAILED
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-details"
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                onClick={() => setEditItem({ type: 'team', data: t })}
                              >
                                Edit
                              </button>
                              {t.payment_status !== 'success' && (
                                <button
                                  className="btn-details"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem', borderColor: '#f59e0b', color: '#d97706' }}
                                  onClick={() => setOverrideModal({ team: t })}
                                >
                                  Mark Verified
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Table View: Audit Log ── */}
        {activeTab === 'audit_log' && (
          <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--bg-card-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)', textAlign: 'left', borderBottom: '1px solid var(--bg-card-border)' }}>
                  <th style={{ padding: '14px 16px' }}>Timestamp</th>
                  <th style={{ padding: '14px 16px' }}>Admin Email</th>
                  <th style={{ padding: '14px 16px' }}>Action</th>
                  <th style={{ padding: '14px 16px' }}>Table / Record ID</th>
                  <th style={{ padding: '14px 16px' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{log.admin_email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: log.action.includes('override') ? 'rgba(245, 158, 11, 0.2)' : 'var(--cyan-dim)', color: log.action.includes('override') ? '#d97706' : 'var(--cyan)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{log.table_name} ({log.record_id.slice(0, 8)})</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>{log.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Manual Payment Verification Override ── */}
      {overrideModal && (
        <div className="modal-overlay active">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setOverrideModal(null)}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-subheading)', marginBottom: '8px', color: '#d97706' }}>
              ⚠️ Manual Payment Verification Override
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              Manually mark payment as <strong>SUCCESS</strong> for Team &quot;{overrideModal.team.team_name}&quot;. This bypasses gateway verification and requires an auditable reason.
            </p>

            {actionErr && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '0.85rem' }}>{actionErr}</div>}

            <div className="form-group">
              <label>Reason for Manual Override *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Received cash payment offline at campus counter / Bank transfer verified by coordinator"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn-details" onClick={() => setOverrideModal(null)}>Cancel</button>
              <button type="button" className="btn-register" style={{ background: '#f59e0b' }} onClick={handleManualOverride}>
                Confirm Manual Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Registration ── */}
      {editItem && (
        <div className="modal-overlay active">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <button className="modal-close" onClick={() => setEditItem(null)}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-subheading)', marginBottom: '16px' }}>
              Edit {editItem.type === 'workshop' ? 'Workshop Registration' : 'Team Registration'}
            </h3>

            {actionErr && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '0.85rem' }}>{actionErr}</div>}

            <form onSubmit={handleSaveEdit}>
              {editItem.type === 'workshop' ? (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editItem.data.name}
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, name: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>USN</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editItem.data.usn || ''}
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, usn: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editItem.data.email}
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, email: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editItem.data.phone}
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, phone: e.target.value } })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Team Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editItem.data.team_name}
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, team_name: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Status</label>
                    <select
                      className="form-select"
                      value={editItem.data.payment_status}
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, payment_status: e.target.value } })}
                    >
                      <option value="pending">pending</option>
                      <option value="success">success</option>
                      <option value="failed">failed</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-details" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="btn-register">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
