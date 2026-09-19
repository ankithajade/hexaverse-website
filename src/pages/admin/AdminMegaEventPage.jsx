import { useEffect, useState, useMemo, Fragment, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlus, FiChevronUp, FiChevronDown, FiAward, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { events as megaEvents } from '../../data/events';
import TeamEditModal from './TeamEditModal';
import AddTeamModal from './AddTeamModal';
import { useAdminSession } from './AdminAuthGate';
import { buildTeamCSV, downloadCSV, downloadTeamExcel } from '../../lib/exportUtils';

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

const EventStatusSelector = ({ currentStatus, updating, onChange }) => {
  const status = currentStatus || 'open';
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: 'var(--bg)',
      border: '1px solid var(--bg-card-border)',
      padding: '3px',
      borderRadius: '8px',
    }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0 6px' }}>
        Registration:
      </span>
      {[
        { id: 'open', label: 'Open', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        { id: 'paused', label: 'Paused', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
        { id: 'closed', label: 'Closed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
      ].map((opt) => {
        const isActive = status === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={updating}
            onClick={() => onChange(opt.id)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: updating ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: isActive ? opt.bg : 'transparent',
              color: isActive ? opt.color : 'var(--text-muted)',
              transition: 'all 0.15s ease',
              opacity: updating ? 0.6 : 1,
            }}
          >
            {isActive && <span style={{ marginRight: '4px' }}>●</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default function AdminMegaEventPage() {
  const { eventId } = useParams();
  const event = megaEvents[eventId];
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [teams, setTeams] = useState([]);
  const [eventRecord, setEventRecord] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Search and payment filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Expandable rows state
  const [expandedTeamIds, setExpandedTeamIds] = useState(new Set());

  // CRUD modal state
  const [editingTeam, setEditingTeam] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Bulk team delete state
  const [selectedTeamIds, setSelectedTeamIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  const eventAccentColor = 'var(--mega-accent, #f59e0b)';
  // Derive teamMax from event metadata items (e.g., '2–4' -> 4)
  const teamMax = eventId === 'treasure-hunt' ? 3 : (eventId === 'hackathon' ? 4 : null);

  const fetchData = async () => {
    if (!eventId) return;
    setLoading(true);
    setFetchError(null);

    try {
      const [{ data: tData, error: tErr }, { data: evData, error: evErr }] = await Promise.all([
        supabase
          .from('teams')
          .select('*, team_members(*), payments(*)')
          .eq('event_slug', eventId)
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select('*')
          .eq('slug', eventId)
          .maybeSingle(),
      ]);

      if (tErr) throw tErr;
      if (evErr) console.warn('Events fetch error:', evErr);

      setTeams(tData || []);
      if (evData) setEventRecord(evData);
    } catch (err) {
      console.error('AdminMegaEventPage fetch error:', err);
      setFetchError(err.message || 'Failed to load mega event team registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEventStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ registration_status: newStatus })
        .eq('slug', eventId);

      if (error) throw error;
      setEventRecord((prev) => (prev ? { ...prev, registration_status: newStatus } : prev));
      await writeAuditLog('UPDATE_EVENT_STATUS', 'events', eventId, null, { slug: eventId, registration_status: newStatus });
    } catch (err) {
      console.error('Failed to update event status:', err);
      alert('Failed to update status: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchData();
    setExpandedTeamIds(new Set());
    setSelectedTeamIds(new Set());
    setSearchQuery('');
    setPaymentFilter('all');
  }, [eventId]);

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

  // ── Delete entire team (members cascade via FK ON DELETE CASCADE) ──
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
        { team_name: deleteConfirmTeam.team_name, event_slug: eventId }, null);
      setDeleteConfirmTeam(null);
      setDeleteConfirmName('');
      fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Delete failed.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  // ── Bulk delete selected teams ──
  const handleToggleSelectAll = () => {
    const allVisibleSelected = filteredTeams.length > 0 && filteredTeams.every((t) => selectedTeamIds.has(t.id));
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredTeams.forEach((t) => next.delete(t.id));
      } else {
        filteredTeams.forEach((t) => next.add(t.id));
      }
      return next;
    });
  };

  const handleToggleSelectTeam = (teamId) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedTeamIds.size === 0) return;
    setBulkDeleteInProgress(true);
    setBulkDeleteError('');
    try {
      const idsArray = Array.from(selectedTeamIds);
      const teamsToDelete = teams.filter((t) => selectedTeamIds.has(t.id));

      const { error } = await supabase
        .from('teams')
        .delete()
        .in('id', idsArray);

      if (error) throw new Error(error.message);

      const batchRecordId = idsArray[0] || '00000000-0000-0000-0000-000000000000';
      await writeAuditLog(
        'BULK_DELETE_TEAMS',
        'teams',
        batchRecordId,
        {
          count: idsArray.length,
          team_ids: idsArray,
          team_names: teamsToDelete.map((t) => t.team_name),
        },
        null
      );

      setSelectedTeamIds(new Set());
      setShowBulkDeleteModal(false);
      fetchData();
    } catch (err) {
      setBulkDeleteError(err.message || 'Bulk delete failed.');
    } finally {
      setBulkDeleteInProgress(false);
    }
  };

  // ── Search & Payment Filtering ──
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (paymentFilter !== 'all' && t.payment_status !== paymentFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.trim().toLowerCase();
      const shortIdObj = formatShortId(t);
      const matchTeam =
        (t.team_name && t.team_name.toLowerCase().includes(q)) ||
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
  }, [teams, searchQuery, paymentFilter]);

  const filteredParticipants = useMemo(
    () => filteredTeams.reduce((sum, t) => sum + (t.team_size || (t.team_members?.length || 0)), 0),
    [filteredTeams]
  );

  const allTeamsExpanded = filteredTeams.length > 0 && filteredTeams.every((t) => expandedTeamIds.has(t.id));

  const toggleExpandAllTeams = () => {
    if (allTeamsExpanded) {
      setExpandedTeamIds(new Set());
    } else {
      setExpandedTeamIds(new Set(filteredTeams.map((t) => t.id)));
    }
  };

  // Statistics
  const totalTeamsCount = teams.length;
  const totalParticipants = teams.reduce((sum, t) => sum + (t.team_size || (t.team_members?.length || 0)), 0);
  const paidTeams = teams.filter((t) => t.payment_status === 'success');
  const paidTeamsCount = paidTeams.length;
  const feePerHead = eventId === 'treasure-hunt' ? 82 : 52;
  const totalRevenue = paidTeams.reduce((sum, t) => sum + (t.team_size * feePerHead), 0);

  const isTeamFiltered = paymentFilter !== 'all' || !!searchQuery.trim();

  // CSV Export for this mega event
  const handleExportCSV = () => {
    const csv = buildTeamCSV(filteredTeams);
    downloadCSV(csv, `${eventId}_teams.csv`);
  };

  // Excel Export for this mega event (2 tabs: flat participant detail + team summary)
  const [exportingExcel, setExportingExcel] = useState(false);
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const headerArgb = eventId === 'treasure-hunt' ? 'FFF59E0B' : 'FF8B5CF6';
      await downloadTeamExcel(
        filteredTeams,
        event.title,
        `${eventId}_teams.xlsx`,
        headerArgb
      );
    } catch (err) {
      console.error('Mega event Excel export error:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingExcel(false);
    }
  };

  if (!event) {
    return (
      <div style={{ padding: '32px' }}>
        <h2>Mega Event Not Found</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '16px' }}>
          No mega event configuration found for ID: <code>{eventId}</code>
        </p>
        <Link to="/ops/console" className="btn-details">
          ← Back to Console Overview
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Event Header ── */}
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
            color: eventAccentColor,
            marginBottom: '6px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: eventAccentColor,
            }} />
            Mega Event · Intra-College (All Departments)
          </div>
          <h1 style={{
            fontFamily: 'var(--font-subheading)',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0,
          }}>
            {event.title}
          </h1>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>Slug: <code>{eventId}</code></span>
            <span>📅 {event.dates}</span>
            <span>👥 Teams of {eventId === 'treasure-hunt' ? '2–3' : '2–4'} members</span>
            <span>💰 ₹{feePerHead}/head</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <EventStatusSelector
            currentStatus={eventRecord?.registration_status || (eventRecord?.is_open === false ? 'closed' : 'open')}
            updating={updatingStatus}
            onChange={(st) => handleUpdateEventStatus(st)}
          />
          <button
            type="button"
            className="btn-details"
            onClick={fetchData}
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            ↺ Refresh
          </button>
          <button
            type="button"
            className="btn-details"
            onClick={handleExportCSV}
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            title={isTeamFiltered ? "Export filtered teams as CSV" : "Export teams as CSV"}
          >
            📥 Export CSV{isTeamFiltered ? ' (Filtered)' : ''}
          </button>
          <button
            type="button"
            className="btn-register"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            style={{ fontSize: '0.82rem', padding: '8px 16px', opacity: exportingExcel ? 0.6 : 1 }}
            title={isTeamFiltered ? "Export filtered teams as Excel" : "Export teams as Excel"}
          >
            {exportingExcel ? '⏳ Building…' : `📊 Export Excel${isTeamFiltered ? ' (Filtered)' : ''}`}
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
          label="Registered Teams"
          value={totalTeamsCount}
          color={eventAccentColor}
          subtitle={`Slug: ${eventId}`}
        />
        <StatCard
          label="Total Participants"
          value={totalParticipants}
          color="var(--text)"
          subtitle="Across all departments"
        />
        <StatCard
          label="Paid / Verified Teams"
          value={`${paidTeamsCount} / ${totalTeamsCount}`}
          color="#10b981"
          subtitle={`${totalTeamsCount - paidTeamsCount} Pending Payment`}
        />
        <StatCard
          label="Verified Revenue"
          value={`₹${totalRevenue}`}
          color="var(--cyan)"
          subtitle={`@ ₹${feePerHead}/head`}
        />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Loading {event.title} registrations…</div>
        </div>
      ) : (
        /* ── Teams Table Container ── */
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Header & Search Bar */}
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
                  Registered Teams
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--mega-accent, #f59e0b)',
                }}>
                  {filteredTeams.length} teams · {filteredParticipants} participants
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                Cross-departmental teams across DBIT
              </div>
            </div>

            {/* Actions & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search team, short ID, member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--bg-card-border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--bg-card-border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Filter by payment status"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
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
              {selectedTeamIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowBulkDeleteModal(true); setBulkDeleteError(''); }}
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239,68,68,0.4)',
                    background: 'rgba(239,68,68,0.12)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🗑 Delete Selected ({selectedTeamIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Table or Empty State */}
          {filteredTeams.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {teams.length === 0 ? (
                eventId === 'hackathon' ? (
                  <>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🚀</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.15rem', fontFamily: 'var(--font-subheading)' }}>
                      Coming Soon
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                      Hackathon registrations will open soon.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-dim)' }}><FiAward /></div>
                    <div style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '1.05rem' }}>
                      No teams registered yet for {event.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                      Teams registered with event slug <code>{eventId}</code> will appear here in real-time.
                    </div>
                  </>
                )
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--text-dim)' }}>No matching teams found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Try adjusting your search term: <em>"{searchQuery}"</em>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-alt)', textAlign: 'left', borderBottom: '1px solid var(--bg-card-border)' }}>
                    <th style={{ width: '36px', padding: '10px 8px 10px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredTeams.length > 0 && filteredTeams.every((t) => selectedTeamIds.has(t.id))}
                        onChange={handleToggleSelectAll}
                        title="Select all visible teams"
                        style={{ cursor: 'pointer', accentColor: '#ef4444' }}
                      />
                    </th>
                    <th style={{ width: '32px', padding: '10px 4px 10px 4px' }} />
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Short ID</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Team Name</th>

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
                          {/* Checkbox */}
                          <td style={{ padding: '12px 8px 12px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedTeamIds.has(team.id)}
                              onChange={() => handleToggleSelectTeam(team.id)}
                              style={{ cursor: 'pointer', accentColor: '#ef4444' }}
                            />
                          </td>

                          {/* Expand toggle */}
                          <td style={{ padding: '12px 4px 12px 4px', textAlign: 'center', userSelect: 'none' }}>
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
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--mega-accent, #f59e0b)',
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

                        {/* Expanded Sub-Table */}
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
                                  flexWrap: 'wrap',
                                  gap: '8px',
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
                                      <th style={{ padding: '6px 12px' }}>Sem / Sec</th>
                                      <th style={{ padding: '6px 12px' }}>USN / Roll No</th>
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
                                                background: 'rgba(245, 158, 11, 0.15)',
                                                color: 'var(--mega-accent, #f59e0b)',
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
                                          <td style={{ padding: '8px 12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                                            {m.semester ? `Sem ${m.semester}` : '—'}{m.section ? ` (${m.section})` : ''}
                                          </td>
                                          <td style={{ padding: '8px 12px' }}>
                                            {m.usn ? <code>{m.usn}</code> : (m.roll_number ? <span style={{ color: 'var(--text)' }}>Roll: {m.roll_number}</span> : '—')}
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
                                                {m.cycle ? `${m.cycle} · ` : ''}{m.dept}
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
            <div style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#ef4444' }}><FiAlertTriangle /></div>
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
          eventSlug={eventId}
          teamMin={eventId === 'treasure-hunt' ? 3 : 2}
          teamMax={teamMax}
          accentColor={eventAccentColor}
          onSaved={fetchData}
          onClose={() => setEditingTeam(null)}
        />
      )}

      {/* ── Add Team Modal ── */}
      {showAddTeam && (
        <AddTeamModal
          eventSlug={eventId}
          teamMax={teamMax}
          accentColor={eventAccentColor}
          onSaved={fetchData}
          onClose={() => setShowAddTeam(false)}
        />
      )}

      {/* ── Bulk Delete Confirmation Modal ── */}
      {showBulkDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid #ef4444',
            borderRadius: '14px', maxWidth: '460px', width: '100%',
            padding: '28px 28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#ef4444' }}><FiAlertTriangle /></div>
            <h3 style={{ fontFamily: 'var(--font-subheading)', margin: '0 0 8px', color: '#ef4444', fontSize: '1.15rem' }}>
              Delete {selectedTeamIds.size} Selected {selectedTeamIds.size === 1 ? 'Team' : 'Teams'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{selectedTeamIds.size}</strong> selected {selectedTeamIds.size === 1 ? 'team' : 'teams'} and all member records? This action <strong>cannot be undone</strong>.
            </p>
            {bulkDeleteError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', color: '#dc2626',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem',
                marginBottom: '12px',
              }}>{bulkDeleteError}</div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowBulkDeleteModal(false); setBulkDeleteError(''); }}
                disabled={bulkDeleteInProgress}
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
                onClick={handleBulkDelete}
                disabled={bulkDeleteInProgress}
                style={{
                  padding: '8px 18px', borderRadius: '7px', border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700,
                  cursor: bulkDeleteInProgress ? 'not-allowed' : 'pointer',
                  opacity: bulkDeleteInProgress ? 0.6 : 1,
                }}
              >
                {bulkDeleteInProgress ? 'Deleting…' : `Delete ${selectedTeamIds.size} ${selectedTeamIds.size === 1 ? 'Team' : 'Teams'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
