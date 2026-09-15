/**
 * TeamEditModal.jsx
 * Shared admin modal: edit team fields, edit/add/delete members, with audit logging.
 * Used by both AdminDepartmentPage and AdminMegaEventPage.
 */
import { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from './AdminAuthGate';

const DEPT_OPTIONS = ['AI & ML', 'AI & DS', 'CSE', 'ISE', 'ECE', 'EEE'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'success', 'failed'];

const EMPTY_NEW_MEMBER = { name: '', usn: '', email: '', phone: '', dept: '' };

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY_STYLE = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const MODAL_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--bg-card-border)',
  borderRadius: '14px',
  width: '100%',
  maxWidth: '720px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--bg-card-border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
  marginBottom: '4px',
};

const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '0' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid #ef4444',
      color: '#dc2626',
      padding: '10px 14px',
      borderRadius: '7px',
      fontSize: '0.85rem',
      marginTop: '10px',
    }}>
      {msg}
    </div>
  );
}

// ── Audit helper ──────────────────────────────────────────────────────────────

async function writeAuditLog(adminEmail, action, tableName, recordId, before, after) {
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
    console.warn('[AuditLog] Failed to write audit entry:', err);
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {object} props.team - Full team object with team_members array
 * @param {string} props.eventSlug - e.g. 'cse-event' or 'hackathon'
 * @param {number|null} props.teamMax - Max allowed members for this event (from data)
 * @param {string} props.accentColor - CSS color string for accent elements
 * @param {function} props.onSaved - Called after any successful mutation so parent can refresh
 * @param {function} props.onClose - Called to close the modal
 */
export default function TeamEditModal({ team, eventSlug, teamMax, accentColor, onSaved, onClose }) {
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  // ── Team-level fields ──
  const [teamName, setTeamName] = useState(team.team_name || '');
  const [paymentStatus, setPaymentStatus] = useState(team.payment_status || 'pending');

  // ── Members ──
  const [members, setMembers] = useState(() =>
    [...(team.team_members || [])].sort((a, b) => (a.position || 0) - (b.position || 0))
  );

  // ── Add-member form ──
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_NEW_MEMBER);

  // ── Saving state ──
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSaving, setAddMemberSaving] = useState(false);

  // ── Delete member confirm ──
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [memberDeleteError, setMemberDeleteError] = useState('');

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Member field helpers ──
  const updateMemberField = (idx, field, value) => {
    setMembers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const setLead = (idx) => {
    setMembers(prev => prev.map((m, i) => ({ ...m, is_lead: i === idx })));
  };

  // ── Save team + all member edits ──
  const handleSaveAll = async () => {
    if (!teamName.trim()) { setSaveError('Team name cannot be empty.'); return; }
    setSaving(true);
    setSaveError('');

    try {
      const beforeTeam = { team_name: team.team_name, payment_status: team.payment_status };
      const afterTeam = { team_name: teamName.trim(), payment_status: paymentStatus };

      // Update team row
      const { error: teamErr } = await supabase.from('teams').update({
        team_name: teamName.trim(),
        payment_status: paymentStatus,
        team_size: members.length,
      }).eq('id', team.id);

      if (teamErr) throw new Error(`Team update failed: ${teamErr.message}`);

      await writeAuditLog(adminEmail, 'UPDATE_TEAM', 'teams', team.id, beforeTeam, afterTeam);

      // Update each member row
      for (const m of members) {
        const { error: mErr } = await supabase.from('team_members').update({
          name: m.name?.trim() || m.name,
          usn: m.usn?.trim().toUpperCase() || m.usn,
          email: m.email?.trim().toLowerCase() || null,
          phone: m.phone?.trim() || null,
          dept: m.dept?.trim() || null,
          is_lead: m.is_lead,
        }).eq('id', m.id);

        if (mErr) throw new Error(`Member update failed (${m.name}): ${mErr.message}`);
      }

      await writeAuditLog(adminEmail, 'UPDATE_TEAM_MEMBERS', 'team_members', team.id, null, { member_count: members.length });

      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete single team member ──
  const handleDeleteMember = async (memberId) => {
    if (members.length <= 1) {
      setMemberDeleteError('Cannot delete the last team member. A team must have at least 1 member.');
      return;
    }
    setDeletingMemberId(memberId);
    setMemberDeleteError('');
    try {
      const memberBefore = members.find(m => m.id === memberId);
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw new Error(error.message);

      await writeAuditLog(adminEmail, 'DELETE_MEMBER', 'team_members', memberId, memberBefore, null);

      setMembers(prev => prev.filter(m => m.id !== memberId));
      // Update team size on the team row
      await supabase.from('teams').update({ team_size: members.length - 1 }).eq('id', team.id);
      onSaved();
    } catch (err) {
      setMemberDeleteError(`Delete failed: ${err.message}`);
    } finally {
      setDeletingMemberId(null);
    }
  };

  // ── Add new member ──
  const handleAddMember = async () => {
    if (!newMember.name.trim() || !newMember.usn.trim()) {
      setAddMemberError('Name and USN are required.');
      return;
    }
    if (teamMax && members.length >= teamMax) {
      setAddMemberError(`Warning: this event allows max ${teamMax} members. Proceeding anyway as admin override.`);
      // Not blocking — just warn; admin may need to override
    }
    setAddMemberSaving(true);
    setAddMemberError('');

    try {
      const nextPosition = members.length > 0 ? Math.max(...members.map(m => m.position || 0)) + 1 : 1;
      const memberPayload = {
        team_id: team.id,
        is_lead: members.length === 0, // first member auto-lead if team is empty
        name: newMember.name.trim(),
        usn: newMember.usn.trim().toUpperCase(),
        email: newMember.email?.trim().toLowerCase() || null,
        phone: newMember.phone?.trim() || null,
        dept: newMember.dept?.trim() || null,
        position: nextPosition,
      };

      const { data: inserted, error } = await supabase.from('team_members').insert(memberPayload).select().single();
      if (error) throw new Error(error.message);

      await writeAuditLog(adminEmail, 'ADD_MEMBER', 'team_members', inserted.id, null, memberPayload);

      // Update team_size
      await supabase.from('teams').update({ team_size: members.length + 1 }).eq('id', team.id);

      setMembers(prev => [...prev, inserted]);
      setNewMember(EMPTY_NEW_MEMBER);
      setShowAddMember(false);
      onSaved();
    } catch (err) {
      setAddMemberError(err.message || 'Failed to add member.');
    } finally {
      setAddMemberSaving(false);
    }
  };

  const accentRgb = accentColor || 'var(--cyan)';

  return (
    <div style={OVERLAY_STYLE} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={MODAL_STYLE} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--bg-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-card)',
          zIndex: 10,
          borderRadius: '14px 14px 0 0',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: accentRgb, letterSpacing: '0.08em', marginBottom: '2px' }}>
              Edit Team
            </div>
            <h2 style={{ fontFamily: 'var(--font-subheading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              {team.team_name}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Slug: <code>{eventSlug}</code> · UUID: <code style={{ fontSize: '0.65rem' }}>{team.id}</code>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '4px' }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px', flex: 1 }}>

          {/* ── Team Fields ── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Team Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FormField label="Team Name">
                <input
                  style={inputStyle}
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                />
              </FormField>
              <FormField label="Payment Status">
                <select
                  style={{ ...inputStyle }}
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                >
                  {PAYMENT_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* ── Members ── */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Team Members ({members.length})</span>
              {teamMax && <span style={{ color: members.length >= teamMax ? '#f59e0b' : 'var(--text-muted)' }}>Max: {teamMax}</span>}
            </div>

            {memberDeleteError && <ErrorBox msg={memberDeleteError} />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {members.map((m, idx) => (
                <div key={m.id || idx} style={{
                  background: 'var(--bg)',
                  border: `1px solid ${m.is_lead ? accentRgb : 'var(--bg-card-border)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  position: 'relative',
                }}>
                  {/* Member header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Member {idx + 1}</span>
                      {/* Lead radio-style button */}
                      <button
                        type="button"
                        onClick={() => setLead(idx)}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${m.is_lead ? accentRgb : 'var(--bg-card-border)'}`,
                          background: m.is_lead ? `${accentRgb}22` : 'transparent',
                          color: m.is_lead ? accentRgb : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {m.is_lead ? '★ Lead' : 'Set as Lead'}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={deletingMemberId === m.id || members.length <= 1}
                      onClick={() => {
                        if (members.length <= 1) {
                          setMemberDeleteError('Cannot delete the last team member.');
                          return;
                        }
                        if (window.confirm(`Delete member "${m.name}" from this team? This cannot be undone.`)) {
                          handleDeleteMember(m.id);
                        }
                      }}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: '5px',
                        border: '1px solid rgba(239,68,68,0.35)',
                        background: 'rgba(239,68,68,0.07)',
                        color: members.length <= 1 ? 'var(--text-muted)' : '#ef4444',
                        cursor: members.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: deletingMemberId === m.id ? 0.5 : 1,
                      }}
                    >
                      {deletingMemberId === m.id ? 'Deleting…' : 'Remove'}
                    </button>
                  </div>

                  {/* Member fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <FormField label="Name">
                      <input style={inputStyle} value={m.name} onChange={e => updateMemberField(idx, 'name', e.target.value)} />
                    </FormField>
                    <FormField label="USN">
                      <input style={inputStyle} value={m.usn} onChange={e => updateMemberField(idx, 'usn', e.target.value)} />
                    </FormField>
                    <FormField label="Email">
                      <input style={inputStyle} type="email" value={m.email || ''} onChange={e => updateMemberField(idx, 'email', e.target.value)} />
                    </FormField>
                    <FormField label="Phone">
                      <input style={inputStyle} type="tel" value={m.phone || ''} onChange={e => updateMemberField(idx, 'phone', e.target.value)} />
                    </FormField>
                    <FormField label="Department">
                      <select style={inputStyle} value={m.dept || ''} onChange={e => updateMemberField(idx, 'dept', e.target.value)}>
                        <option value="">— Not specified —</option>
                        {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </FormField>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Add Member Form ── */}
            {showAddMember ? (
              <div style={{
                marginTop: '14px',
                background: 'var(--bg)',
                border: '1px dashed var(--bg-card-border)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '12px' }}>
                  New Member
                  {teamMax && members.length >= teamMax && (
                    <span style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '0.7rem' }}>
                       <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '3px' }} />Exceeds event max ({teamMax}) — admin override
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <FormField label="Name *">
                    <input style={inputStyle} value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
                  </FormField>
                  <FormField label="USN *">
                    <input style={inputStyle} value={newMember.usn} onChange={e => setNewMember(p => ({ ...p, usn: e.target.value }))} />
                  </FormField>
                  <FormField label="Email">
                    <input style={inputStyle} type="email" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} />
                  </FormField>
                  <FormField label="Phone">
                    <input style={inputStyle} type="tel" value={newMember.phone} onChange={e => setNewMember(p => ({ ...p, phone: e.target.value }))} />
                  </FormField>
                  <FormField label="Department">
                    <select style={inputStyle} value={newMember.dept} onChange={e => setNewMember(p => ({ ...p, dept: e.target.value }))}>
                      <option value="">— Not specified —</option>
                      {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormField>
                </div>
                {addMemberError && <ErrorBox msg={addMemberError} />}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={addMemberSaving}
                    style={{
                      padding: '7px 16px', borderRadius: '6px', border: 'none',
                      background: accentRgb === 'var(--mega-accent, #f59e0b)' ? '#f59e0b' : 'var(--cyan)',
                      color: '#000', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      opacity: addMemberSaving ? 0.6 : 1,
                    }}
                  >
                    {addMemberSaving ? 'Adding…' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddMember(false); setAddMemberError(''); setNewMember(EMPTY_NEW_MEMBER); }}
                    style={{
                      padding: '7px 14px', borderRadius: '6px',
                      border: '1px solid var(--bg-card-border)', background: 'transparent',
                      color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                style={{
                  marginTop: '12px', width: '100%', padding: '8px',
                  borderRadius: '7px', border: '1px dashed var(--bg-card-border)',
                  background: 'transparent', color: 'var(--text-muted)',
                  fontSize: '0.82rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                + Add Another Member
              </button>
            )}
          </div>

          {saveError && <ErrorBox msg={saveError} />}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--bg-card-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          position: 'sticky',
          bottom: 0,
          background: 'var(--bg-card)',
          borderRadius: '0 0 14px 14px',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px', borderRadius: '7px',
              border: '1px solid var(--bg-card-border)', background: 'transparent',
              color: 'var(--text-dim)', fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              padding: '9px 22px', borderRadius: '7px', border: 'none',
              background: 'var(--cyan)', color: '#000', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
