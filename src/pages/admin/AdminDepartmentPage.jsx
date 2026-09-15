import { useEffect, useState, useMemo, Fragment, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlus, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { departments } from '../../data/departments';
import TeamEditModal from './TeamEditModal';
import AddTeamModal from './AddTeamModal';
import { useAdminSession } from './AdminAuthGate';
import {
  buildWorkshopCSV,
  buildTeamCSV,
  downloadCSV,
  downloadWorkshopExcel,
  downloadTeamExcel,
  resolveCssVar,
  toArgb,
} from '../../lib/exportUtils';

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatShortId(team) {
  if (team.short_id) {
    return {
      label: team.short_id.toUpperCase(),
      isLegacy: false,
    };
  }
  const slice = team.id ? team.id.replace(/-/g, '').slice(0, 8) : 'unknown';
  return {
    label: `legacy-${slice}`,
    isLegacy: true,
  };
}

const StatCard = ({ label, value, color, subtitle }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card-border)',
    padding: '16px 20px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }}>
    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
      {label}
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color || 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
        {subtitle}
      </div>
    )}
  </div>
);

export default function AdminDepartmentPage() {
  const { deptId } = useParams();
  const dept = departments[deptId];
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [workshops, setWorkshops] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Active tab state: 'workshop' | 'event'
  const [activeTab, setActiveTab] = useState('workshop');

  // Search filter states
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');

  // Expandable rows state for teams
  const [expandedTeamIds, setExpandedTeamIds] = useState(new Set());

  // CRUD modal state
  const [editingTeam, setEditingTeam] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState(null); // team object
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const workshopSlug = `${deptId}-workshop`;
  const signatureSlug = `${deptId}-event`;

  const deptColor = dept?.cssVar || 'var(--cyan)';

  const fetchData = async () => {
    if (!dept) return;
    setLoading(true);
    setFetchError(null);

    try {
      const [{ data: wData, error: wErr }, { data: tData, error: tErr }] = await Promise.all([
        supabase
          .from('workshop_registrations')
          .select('*')
          .eq('event_slug', workshopSlug)
          .order('created_at', { ascending: false }),
        supabase
          .from('teams')
          .select('*, team_members(*), payments(*)')
          .eq('event_slug', signatureSlug)
          .order('created_at', { ascending: false }),
      ]);

      if (wErr) console.error('Error fetching workshop data:', wErr);
      if (tErr) console.error('Error fetching teams data:', tErr);

      setWorkshops(wData || []);
      setTeams(tData || []);
    } catch (err) {
      console.error('AdminDepartmentPage fetch error:', err);
      setFetchError(err.message || 'Failed to load department registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setExpandedTeamIds(new Set());
    setWorkshopSearch('');
    setTeamSearch('');
  }, [deptId]);

  const toggleExpand = (teamId) => {
    setExpandedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  // ── Audit log helper ──
  const writeAuditLog = useCallback(async (action, tableName, recordId, before, after) => {
    try {
      await supabase.from('admin_audit_log').insert({
        admin_email: adminEmail,
        action,
        table_name: tableName,
        record_id: recordId,
        before: before || null,
        after: after || null,
      });
    } catch (err) {
      console.warn('[AuditLog]', err);
    }
  }, [adminEmail]);

  // ── Delete entire team (cascade to members via FK ON DELETE CASCADE) ──
  const handleDeleteTeam = async () => {
    if (!deleteConfirmTeam) return;
    if (deleteConfirmName.trim() !== deleteConfirmTeam.team_name.trim()) {
      setDeleteError('Team name does not match. Please type it exactly.');
      return;
    }
    setDeleteInProgress(true);
    setDeleteError('');
    try {
      const { error } = await supabase.from('teams').delete().eq('id', deleteConfirmTeam.id);
      if (error) throw new Error(error.message);
      await writeAuditLog('DELETE_TEAM', 'teams', deleteConfirmTeam.id,
        { team_name: deleteConfirmTeam.team_name, event_slug: deleteConfirmTeam.event_slug }, null);
      setDeleteConfirmTeam(null);
      setDeleteConfirmName('');
      fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Delete failed.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  // ── Filtered Workshops ──
  const filteredWorkshops = useMemo(() => {
    if (!workshopSearch.trim()) return workshops;
    const q = workshopSearch.trim().toLowerCase();
    return workshops.filter((w) =>
      (w.name && w.name.toLowerCase().includes(q)) ||
      (w.usn && w.usn.toLowerCase().includes(q)) ||
      (w.email && w.email.toLowerCase().includes(q)) ||
      (w.phone && w.phone.toLowerCase().includes(q))
    );
  }, [workshops, workshopSearch]);

  // ── Filtered Teams ──
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return teams;
    const q = teamSearch.trim().toLowerCase();
    return teams.filter((t) => {
      const shortIdObj = formatShortId(t);
      const matchTeam =
        (t.team_name && t.team_name.toLowerCase().includes(q)) ||
        (t.college && t.college.toLowerCase().includes(q)) ||
        shortIdObj.label.toLowerCase().includes(q) ||
        (t.payment_status && t.payment_status.toLowerCase().includes(q));

      const matchMember = (t.team_members || []).some(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.usn && m.usn.toLowerCase().includes(q)) ||
          (m.dept && m.dept.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.phone && m.phone.toLowerCase().includes(q))
      );

      return matchTeam || matchMember;
    });
  }, [teams, teamSearch]);

  const allTeamsExpanded = filteredTeams.length > 0 && filteredTeams.every((t) => expandedTeamIds.has(t.id));

  const toggleExpandAllTeams = () => {
    if (allTeamsExpanded) {
      setExpandedTeamIds(new Set());
    } else {
      setExpandedTeamIds(new Set(filteredTeams.map((t) => t.id)));
    }
  };

  // Calculations
  const totalWorkshopAttendees = workshops.length;
  const totalTeamsCount = teams.length;
  const totalTeamParticipants = teams.reduce((sum, t) => sum + (t.team_size || (t.team_members?.length || 0)), 0);
  const paidTeamsCount = teams.filter((t) => t.payment_status === 'success').length;

  // ── Workshop Exports (Section A) ──
  const [exportingWorkshopExcel, setExportingWorkshopExcel] = useState(false);
  const handleExportWorkshopCSV = () => {
    const csv = buildWorkshopCSV(workshops);
    downloadCSV(csv, `${deptId}_workshop_registrations.csv`);
  };

  const handleExportWorkshopExcel = async () => {
    setExportingWorkshopExcel(true);
    try {
      const hex = resolveCssVar(deptColor);
      await downloadWorkshopExcel(
        workshops,
        `${dept?.name || deptId}`,
        `${deptId}_workshop_registrations.xlsx`,
        toArgb(hex)
      );
    } catch (err) {
      console.error('Workshop Excel export error:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingWorkshopExcel(false);
    }
  };

  // ── Signature Event Team Exports (Section B) ──
  const [exportingTeamExcel, setExportingTeamExcel] = useState(false);
  const handleExportTeamCSV = () => {
    const csv = buildTeamCSV(teams);
    downloadCSV(csv, `${deptId}_signature_teams.csv`);
  };

  const handleExportTeamExcel = async () => {
    setExportingTeamExcel(true);
    try {
      const hex = resolveCssVar(deptColor);
      await downloadTeamExcel(
        teams,
        `${dept?.name || deptId}`,
        `${deptId}_signature_teams.xlsx`,
        toArgb(hex)
      );
    } catch (err) {
      console.error('Team Excel export error:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingTeamExcel(false);
    }
  };

  if (!dept) {
    return (
      <div style={{ padding: '32px' }}>
        <h2>Department Not Found</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '16px' }}>
          No department configuration found for ID: <code>{deptId}</code>
        </p>
        <Link to="/ops/console" className="btn-details">
          ← Back to Console Overview
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Department Header ── */}
      <div style={{
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--bg-card-border)',
        paddingBottom: '20px',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: deptColor,
            marginBottom: '6px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: deptColor,
            }} />
            {dept.week || 'Department Week'} · {dept.name}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-subheading)',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0,
          }}>
            {dept.fullName || dept.name}
          </h1>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Workshop: <code>{workshopSlug}</code> · Signature: <code>{signatureSlug}</code>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-details"
            onClick={fetchData}
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      {fetchError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.9rem',
        }}>
          {fetchError}
        </div>
      )}

      {/* ── Summary Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '32px',
      }}>
        <StatCard
          label="Workshop Attendees"
          value={totalWorkshopAttendees}
          color="#10b981"
          subtitle="Free Individual Registrations"
        />
        <StatCard
          label="Signature Event Teams"
          value={totalTeamsCount}
          color={deptColor}
          subtitle={`${paidTeamsCount} Paid · ${totalTeamsCount - paidTeamsCount} Pending`}
        />
        <StatCard
          label="Total Participants"
          value={totalWorkshopAttendees + totalTeamParticipants}
          color="var(--text)"
          subtitle={`${totalTeamParticipants} in Teams + ${totalWorkshopAttendees} Workshop`}
        />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Loading {dept.name} data…</div>
        </div>
      ) : (
        <div>
          {/* ── Tabs Navigation ── */}
          <div style={{
            display: 'inline-flex',
            gap: '6px',
            background: 'var(--bg-card)',
            padding: '5px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid var(--bg-card-border)',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('workshop')}
              style={{
                padding: '8px 18px',
                borderRadius: '7px',
                border: 'none',
                background: activeTab === 'workshop' ? 'var(--bg-alt)' : 'transparent',
                color: activeTab === 'workshop' ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Workshop</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: '10px',
                background: activeTab === 'workshop' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.05)',
                color: activeTab === 'workshop' ? '#10b981' : 'var(--text-muted)',
                fontWeight: 700,
              }}>
                {workshops.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('event')}
              style={{
                padding: '8px 18px',
                borderRadius: '7px',
                border: 'none',
                background: activeTab === 'event' ? 'var(--bg-alt)' : 'transparent',
                color: activeTab === 'event' ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Signature Event</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: '10px',
                background: activeTab === 'event' ? 'var(--cyan-dim)' : 'rgba(0,0,0,0.05)',
                color: activeTab === 'event' ? 'var(--cyan)' : 'var(--text-muted)',
                fontWeight: 700,
              }}>
                {teams.length}
              </span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* SECTION A — WORKSHOP REGISTRATIONS                                 */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'workshop' && (
            <section style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--bg-card-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
            {/* Header & Controls */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--bg-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-subheading)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text)',
                  }}>
                    Workshop Registrations
                  </h2>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                  }}>
                    {workshops.length} total
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                  Event Slug: <code>{workshopSlug}</code> · Free Individual Workshop
                </div>
              </div>

              {/* Search & Export */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search name, USN, email..."
                  value={workshopSearch}
                  onChange={(e) => setWorkshopSearch(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--bg-card-border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    minWidth: '200px',
                  }}
                />
                {workshopSearch && (
                  <button
                    type="button"
                    onClick={() => setWorkshopSearch('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportWorkshopCSV}
                  className="btn-details"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  title="Export workshop registrants as CSV"
                >
                  📥 Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportWorkshopExcel}
                  disabled={exportingWorkshopExcel}
                  className="btn-details"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', opacity: exportingWorkshopExcel ? 0.6 : 1 }}
                  title="Export workshop registrants as Excel (.xlsx)"
                >
                  {exportingWorkshopExcel ? '⏳ Building…' : '📊 Export Excel'}
                </button>
              </div>
            </div>

            {/* Table or Empty State */}
            {filteredWorkshops.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {workshops.length === 0 ? (
                  <>
                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📝</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-dim)' }}>No workshop registrations yet</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Registrations for <code>{workshopSlug}</code> will appear here automatically.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--text-dim)' }}>No matching workshop registrants found</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Try adjusting your search term: <em>"{workshopSearch}"</em>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-alt)', textAlign: 'left', borderBottom: '1px solid var(--bg-card-border)' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>USN</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Semester</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Email</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Phone</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Registered At</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkshops.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text)' }}>
                          {w.name}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {w.usn ? <code>{w.usn}</code> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--bg-alt)',
                            border: '1px solid var(--bg-card-border)',
                          }}>
                            Sem {w.semester}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-dim)' }}>
                          <a href={`mailto:${w.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {w.email}
                          </a>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-dim)' }}>
                          <a href={`tel:${w.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {w.phone}
                          </a>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDateTime(w.created_at)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: (w.status === 'cancelled') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: (w.status === 'cancelled') ? '#ef4444' : '#10b981',
                          }}>
                            {w.status || 'confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* SECTION B — SIGNATURE EVENT TEAMS                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'event' && (
          <section style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {/* Header & Controls */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--bg-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-subheading)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text)',
                  }}>
                    Signature Event Teams
                  </h2>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'var(--cyan-dim)',
                    color: 'var(--cyan)',
                  }}>
                    {teams.length} teams · {totalTeamParticipants} participants
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                  Event Slug: <code>{signatureSlug}</code> · Team Competition
                </div>
              </div>

              {/* Actions & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search team, ID, member..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--bg-card-border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    minWidth: '200px',
                  }}
                />
                {filteredTeams.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleExpandAllTeams}
                    className="btn-details"
                    style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title={allTeamsExpanded ? 'Collapse All' : 'Expand All'}
                  >
                    {allTeamsExpanded ? <FiChevronUp style={{ fontSize: '0.9rem' }} /> : <FiChevronDown style={{ fontSize: '0.9rem' }} />}
                    {allTeamsExpanded ? 'Collapse All' : 'Expand All'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportTeamCSV}
                  className="btn-details"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  title="Export signature event teams as CSV (flat participant rows)"
                >
                  📥 Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportTeamExcel}
                  disabled={exportingTeamExcel}
                  className="btn-details"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', opacity: exportingTeamExcel ? 0.6 : 1 }}
                  title="Export signature event teams as Excel (.xlsx with detail + summary tabs)"
                >
                  {exportingTeamExcel ? '⏳ Building…' : '📊 Export Excel'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTeam(true)}
                  className="btn-register"
                  style={{
                    fontSize: '0.85rem',
                    padding: '7px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Add Team"
                  aria-label="Add Team"
                >
                  <FiPlus style={{ fontSize: '1.1rem' }} />
                </button>
              </div>
            </div>

            {/* Table or Empty State */}
            {filteredTeams.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {teams.length === 0 ? (
                  <>
                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>👥</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-dim)' }}>No signature event teams registered yet</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Team registrations for <code>{signatureSlug}</code> will appear here automatically.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--text-dim)' }}>No matching teams found</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Try adjusting your search term: <em>"{teamSearch}"</em>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-alt)', textAlign: 'left', borderBottom: '1px solid var(--bg-card-border)' }}>
                      <th style={{ width: '38px', padding: '10px 8px 10px 16px' }} />
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Short ID</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Team Name</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>College</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Lead Contact</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Size</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Payment</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Registered At</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team) => {
                      const shortObj = formatShortId(team);
                      const isExpanded = expandedTeamIds.has(team.id);
                      const lead = (team.team_members || []).find((m) => m.is_lead) || team.team_members?.[0];
                      const memberCount = team.team_size || team.team_members?.length || 0;

                      return (
                        <Fragment key={team.id}>
                          {/* Main Team Row */}
                          <tr
                            onClick={() => toggleExpand(team.id)}
                            style={{
                              borderBottom: isExpanded ? 'none' : '1px solid var(--bg-card-border)',
                              background: isExpanded ? 'var(--bg-alt)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                          >
                            {/* Expand toggle */}
                            <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center', userSelect: 'none' }}>
                              <span style={{
                                display: 'inline-block',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.15s',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                              }}>
                                ▶
                              </span>
                            </td>

                            {/* Short ID */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              {shortObj.isLegacy ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: 'rgba(100, 116, 139, 0.12)',
                                  color: '#64748b',
                                  fontFamily: 'monospace',
                                  border: '1px dashed rgba(100, 116, 139, 0.3)',
                                }}>
                                  {shortObj.label}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--cyan-dim)',
                                  color: 'var(--cyan)',
                                  letterSpacing: '0.06em',
                                  fontFamily: 'monospace',
                                }}>
                                  {shortObj.label}
                                </span>
                              )}
                            </td>

                            {/* Team Name */}
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text)' }}>
                              <div>{team.team_name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                click to {isExpanded ? 'hide' : 'view'} {memberCount} members
                              </div>
                            </td>

                            {/* College */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                fontSize: '0.78rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: team.college && team.college !== 'DBIT' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-alt)',
                                color: team.college && team.college !== 'DBIT' ? '#3b82f6' : 'var(--text-dim)',
                                fontWeight: team.college && team.college !== 'DBIT' ? 600 : 400,
                                border: '1px solid var(--bg-card-border)',
                              }}>
                                {team.college || '—'}
                              </span>
                            </td>

                            {/* Lead Contact */}
                            <td style={{ padding: '12px 14px' }}>
                              {lead ? (
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                                    {lead.name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>({lead.usn})</span>
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                                    {lead.email} {lead.phone && `· ${lead.phone}`}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>No lead listed</span>
                              )}
                            </td>

                            {/* Team Size */}
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: 'var(--bg-alt)',
                                border: '1px solid var(--bg-card-border)',
                              }}>
                                {memberCount}
                              </span>
                            </td>

                            {/* Payment Status */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                background: team.payment_status === 'success'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : team.payment_status === 'failed'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(245, 158, 11, 0.12)',
                                color: team.payment_status === 'success'
                                  ? '#10b981'
                                  : team.payment_status === 'failed'
                                  ? '#ef4444'
                                  : '#f59e0b',
                              }}>
                                {team.payment_status || 'pending'}
                              </span>
                            </td>

                            {/* Registered At */}
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {formatDateTime(team.created_at)}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingTeam(team)}
                                  style={{
                                    fontSize: '0.72rem', padding: '4px 10px', borderRadius: '5px',
                                    border: '1px solid var(--bg-card-border)', background: 'var(--bg)',
                                    color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 600,
                                  }}
                                >
                                  ✏ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setDeleteConfirmTeam(team); setDeleteConfirmName(''); setDeleteError(''); }}
                                  style={{
                                    fontSize: '0.72rem', padding: '4px 10px', borderRadius: '5px',
                                    border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)',
                                    color: '#ef4444', cursor: 'pointer', fontWeight: 600,
                                  }}
                                >
                                  🗑 Delete
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Nested Sub-table */}
                          {isExpanded && (
                            <tr style={{ background: 'var(--bg-alt)' }}>
                              <td colSpan={8} style={{ padding: '0 20px 18px 46px', borderBottom: '1px solid var(--bg-card-border)' }}>
                                <div style={{
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--bg-card-border)',
                                  borderRadius: '8px',
                                  padding: '14px 18px',
                                  marginTop: '4px',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                }}>
                                  <div style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'var(--text-muted)',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}>
                                    <span>All Team Members ({team.team_members?.length || 0})</span>
                                    <span>Team UUID: <code style={{ fontSize: '0.7rem' }}>{team.id}</code></span>
                                  </div>

                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--bg-card-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '6px 8px', width: '32px' }}>#</th>
                                        <th style={{ padding: '6px 12px' }}>Role</th>
                                        <th style={{ padding: '6px 12px' }}>Member Name</th>
                                        <th style={{ padding: '6px 12px' }}>USN</th>
                                        <th style={{ padding: '6px 12px' }}>Department</th>
                                        <th style={{ padding: '6px 12px' }}>Email</th>
                                        <th style={{ padding: '6px 12px' }}>Phone</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(team.team_members || [])
                                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                                        .map((m, idx) => (
                                          <tr key={m.id || idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                            <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                                              {m.position || idx + 1}
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                              {m.is_lead ? (
                                                <span style={{
                                                  fontSize: '0.7rem',
                                                  fontWeight: 700,
                                                  padding: '2px 6px',
                                                  borderRadius: '4px',
                                                  background: 'var(--cyan-dim)',
                                                  color: 'var(--cyan)',
                                                }}>
                                                  ★ Lead
                                                </span>
                                              ) : (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                  Member
                                                </span>
                                              )}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text)' }}>
                                              {m.name}
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                              <code>{m.usn}</code>
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                              {m.dept ? (
                                                <span style={{
                                                  fontSize: '0.75rem',
                                                  fontWeight: 600,
                                                  padding: '2px 6px',
                                                  borderRadius: '4px',
                                                  background: 'var(--bg-alt)',
                                                  border: '1px solid var(--bg-card-border)',
                                                  color: 'var(--text)',
                                                }}>
                                                  {m.dept}
                                                </span>
                                              ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                              )}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>
                                              {m.email ? (
                                                <a href={`mailto:${m.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                  {m.email}
                                                </a>
                                              ) : '—'}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>
                                              {m.phone ? (
                                                <a href={`tel:${m.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                  {m.phone}
                                                </a>
                                              ) : '—'}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          )}

        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmTeam && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid #ef4444',
            borderRadius: '14px', maxWidth: '440px', width: '100%',
            padding: '28px 28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-subheading)', margin: '0 0 8px', color: '#ef4444', fontSize: '1.1rem' }}>
              Delete Team Permanently
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.5 }}>
              This will permanently delete <strong style={{ color: 'var(--text)' }}>{deleteConfirmTeam.team_name}</strong> and all its members.
              This action <strong>cannot be undone</strong>.
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Type the team name to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={e => { setDeleteConfirmName(e.target.value); setDeleteError(''); }}
              placeholder={deleteConfirmTeam.team_name}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid #ef4444', background: 'var(--bg)',
                color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box', marginBottom: '12px',
              }}
            />
            {deleteError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', color: '#dc2626',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem',
                marginBottom: '12px',
              }}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setDeleteConfirmTeam(null); setDeleteConfirmName(''); setDeleteError(''); }}
                style={{
                  padding: '8px 18px', borderRadius: '7px',
                  border: '1px solid var(--bg-card-border)', background: 'transparent',
                  color: 'var(--text-dim)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={deleteInProgress || deleteConfirmName.trim() !== deleteConfirmTeam.team_name.trim()}
                style={{
                  padding: '8px 18px', borderRadius: '7px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700,
                  cursor: deleteInProgress || deleteConfirmName.trim() !== deleteConfirmTeam.team_name.trim() ? 'not-allowed' : 'pointer',
                  opacity: deleteInProgress || deleteConfirmName.trim() !== deleteConfirmTeam.team_name.trim() ? 0.5 : 1,
                }}
              >
                {deleteInProgress ? 'Deleting…' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Team Modal ── */}
      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          eventSlug={signatureSlug}
          teamMax={dept?.events?.find(e => e.eventId === signatureSlug)?.teamMax ?? null}
          accentColor={deptColor}
          onSaved={fetchData}
          onClose={() => setEditingTeam(null)}
        />
      )}

      {/* ── Add Team Modal ── */}
      {showAddTeam && (
        <AddTeamModal
          eventSlug={signatureSlug}
          teamMax={dept?.events?.find(e => e.eventId === signatureSlug)?.teamMax ?? null}
          accentColor={deptColor}
          onSaved={fetchData}
          onClose={() => setShowAddTeam(false)}
        />
      )}
    </div>
  );
}
