import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from './AdminAuthGate';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// Event slugs and their short display labels for the chart
const EVENT_SLUGS = [
  { slug: 'aiml-workshop',  label: 'AI&ML W/S',  type: 'workshop' },
  { slug: 'aids-workshop',  label: 'AI&DS W/S',  type: 'workshop' },
  { slug: 'cse-workshop',   label: 'CSE W/S',    type: 'workshop' },
  { slug: 'ise-workshop',   label: 'ISE W/S',    type: 'workshop' },
  { slug: 'ece-workshop',   label: 'ECE W/S',    type: 'workshop' },
  { slug: 'eee-workshop',   label: 'EEE W/S',    type: 'workshop' },
  { slug: 'aiml-event',     label: 'AI&ML Sig',  type: 'team' },
  { slug: 'aids-event',     label: 'AI&DS Sig',  type: 'team' },
  { slug: 'cse-event',      label: 'CSE Sig',    type: 'team' },
  { slug: 'ise-event',      label: 'ISE Sig',    type: 'team' },
  { slug: 'ece-event',      label: 'ECE Sig',    type: 'team' },
  { slug: 'eee-event',      label: 'EEE Sig',    type: 'team' },
  { slug: 'treasure-hunt',  label: 'Treas. Hunt', type: 'team' },
  { slug: 'hackathon',      label: 'Hackathon',  type: 'team' },
];

// Bar colours cycling through site accent vars (resolved at runtime)
const BAR_COLORS = [
  'var(--aiml)', 'var(--aiml)',
  'var(--aids)', 'var(--aids)',
  'var(--cse)',  'var(--cse)',
  'var(--ise)',  'var(--ise)',
  'var(--ece)',  'var(--ece)',
  'var(--eee)',  'var(--eee)',
  'var(--cyan)', 'var(--orange)',
];

// Resolve a CSS variable to its computed hex/rgb value
function resolveCssVar(varStr) {
  if (typeof window === 'undefined') return '#38bdf8';
  const raw = varStr.replace('var(', '').replace(')', '').trim();
  return getComputedStyle(document.documentElement).getPropertyValue(raw).trim() || '#38bdf8';
}

const StatCard = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    padding: '20px 24px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }}>
    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
      {label}
    </div>
    <div style={{ fontSize: '2.1rem', fontWeight: 800, color: color || 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
      {value}
    </div>
  </div>
);

export default function AdminHome() {
  const { session } = useAdminSession();

  const [workshops, setWorkshops] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // CSV export state (carried over from old dashboard — all events)
  const [selectedEvent, setSelectedEvent] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: wData }, { data: tData }] = await Promise.all([
        supabase.from('workshop_registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('*, team_members(*), payments(*)').order('created_at', { ascending: false }),
      ]);
      setWorkshops(wData || []);
      setTeams(tData || []);
    } catch (err) {
      console.error('AdminHome fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Same stat calculations as old AdminDashboard ──
  const totalWorkshops = workshops.length;
  const totalTeams = teams.length;
  const paidTeams = teams.filter((t) => t.payment_status === 'success').length;
  const totalRevenue = teams
    .filter((t) => t.payment_status === 'success')
    .reduce((sum, t) => sum + t.team_size * (t.event_slug === 'treasure-hunt' ? 80 : 50), 0);

  // ── Chart data: count per event slug ──
  const chartData = EVENT_SLUGS.map(({ slug, label, type }) => {
    const count = type === 'workshop'
      ? workshops.filter((w) => w.event_slug === slug).length
      : teams.filter((t) => t.event_slug === slug).length;
    return { label, count };
  });

  // Resolve CSS vars once for recharts (can't use CSS vars in SVG fill directly)
  const resolvedColors = BAR_COLORS.map(resolveCssVar);

  // ── CSV Export (same logic as old dashboard, all events) ──
  const handleExportCSV = async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const token = s?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_participants.csv';
        a.click();
        return;
      }
    } catch {
      /* fall through to client fallback */
    }

    // Client-side fallback
    let csv = 'Type,Event Slug,ID,Name/Team,USN/Lead,Email,Phone,Payment Status,Created At\n';
    workshops.forEach((w) => {
      csv += `"Workshop","${w.event_slug}","${w.id}","${w.name}","${w.usn || ''}","${w.email}","${w.phone}","confirmed","${w.created_at}"\n`;
    });
    teams.forEach((t) => {
      const lead = t.team_members?.find((m) => m.is_lead) || t.team_members?.[0];
      csv += `"Team","${t.event_slug}","${t.id}","${t.team_name}","${lead?.usn || ''}","${lead?.email || ''}","${lead?.phone || ''}","${t.payment_status}","${t.created_at}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_export.csv';
    a.click();
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Overview
          </div>
          <h1 style={{ fontFamily: 'var(--font-subheading)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-details" onClick={fetchData} style={{ fontSize: '0.82rem' }}>
            ↺ Refresh
          </button>
          <button className="btn-register" onClick={handleExportCSV} style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
            📥 Export All CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>Loading data…</p>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
            <StatCard label="Total Registrations" value={totalWorkshops + totalTeams} color="var(--text)" />
            <StatCard label="Total Revenue" value={`₹${totalRevenue}`} color="var(--cyan)" />
            <StatCard label="Free Workshop Attendees" value={totalWorkshops} color="#10b981" />
            <StatCard label="Paid Teams (Success)" value={`${paidTeams} / ${totalTeams}`} color="var(--orange)" />
          </div>

          {/* ── Bar Chart: Registrations per Event ── */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Registrations by Event
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                Per-event registration count
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 60 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--bg-card-border)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--text)',
                  }}
                  cursor={{ fill: 'rgba(4,36,43,0.05)' }}
                  formatter={(value) => [value, 'Registrations']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={resolvedColors[index] || '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              W/S = Workshop · Sig = Signature Event
            </div>
          </div>

          {/* ── Quick summary table ── */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-card-border)', fontWeight: 700, fontSize: '0.9rem' }}>
              Event Breakdown
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-alt)', textAlign: 'left', borderBottom: '1px solid var(--bg-card-border)' }}>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Event</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Type</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Registrations</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENT_SLUGS.map(({ slug, label, type }, i) => {
                    const count = type === 'workshop'
                      ? workshops.filter((w) => w.event_slug === slug).length
                      : teams.filter((t) => t.event_slug === slug).length;
                    return (
                      <tr key={slug} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 500 }}>{label}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                            background: type === 'workshop' ? 'rgba(16,185,129,0.12)' : 'var(--cyan-dim)',
                            color: type === 'workshop' ? '#10b981' : 'var(--cyan)',
                          }}>
                            {type === 'workshop' ? 'Workshop' : 'Team Event'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
