/**
 * AddTeamModal.jsx
 * Modal to manually create a new team (admin-side, e.g. phone registration).
 * The existing assign_team_short_id trigger handles short_id automatically.
 * Used by both AdminDepartmentPage and AdminMegaEventPage.
 */
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from './AdminAuthGate';

const DEPT_OPTIONS = ['AI & ML', 'AI & DS', 'CSE', 'ISE', 'ECE', 'EEE'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'success', 'failed'];

const EMPTY_MEMBER = { name: '', usn: '', email: '', phone: '', dept: '' };

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
  maxWidth: '680px',
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

function FormField({ label, children }) {
  return (
    <div>
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
    console.warn('[AuditLog]', err);
  }
}

/**
 * @param {object} props
 * @param {string} props.eventSlug - e.g. 'cse-event' or 'treasure-hunt'
 * @param {number|null} props.teamMax - event max members, for warning
 * @param {string} props.accentColor - CSS var string
 * @param {function} props.onSaved - parent refresh callback
 * @param {function} props.onClose
 */
export default function AddTeamModal({ eventSlug, teamMax, accentColor, onSaved, onClose }) {
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [teamName, setTeamName] = useState('');
  const [college, setCollege] = useState('DBIT');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Always start with at least one member
  const [members, setMembers] = useState([{ ...EMPTY_MEMBER }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateMember = (idx, field, value) => {
    setMembers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addMemberRow = () => {
    setMembers(prev => [...prev, { ...EMPTY_MEMBER }]);
  };

  const removeMemberRow = (idx) => {
    if (members.length <= 1) return;
    setMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) { setError('Team name is required.'); return; }
    if (!members[0]?.name?.trim() || !members[0]?.usn?.trim()) {
      setError('At least one member with name and USN is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // 1. Insert team — trigger assigns short_id automatically
      const { data: teamData, error: teamErr } = await supabase.from('teams').insert({
        event_slug: eventSlug,
        team_name: teamName.trim(),
        college: college.trim() || 'DBIT',
        payment_status: paymentStatus,
        team_size: members.length,
      }).select().single();

      if (teamErr) throw new Error(`Failed to create team: ${teamErr.message}`);

      await writeAuditLog(adminEmail, 'ADD_TEAM', 'teams', teamData.id, null, {
        team_name: teamData.team_name,
        event_slug: eventSlug,
        college: teamData.college,
        payment_status: teamData.payment_status,
      });

      // 2. Insert members
      const memberRows = members.map((m, idx) => ({
        team_id: teamData.id,
        is_lead: idx === 0, // first member is always lead
        name: m.name.trim(),
        usn: m.usn.trim().toUpperCase(),
        email: m.email?.trim().toLowerCase() || null,
        phone: m.phone?.trim() || null,
        dept: m.dept?.trim() || null,
        position: idx + 1,
      }));

      const { data: insertedMembers, error: membersErr } = await supabase
        .from('team_members')
        .insert(memberRows)
        .select();

      if (membersErr) {
        // If members insert fails, clean up team to avoid orphans
        await supabase.from('teams').delete().eq('id', teamData.id);
        throw new Error(`Failed to add members: ${membersErr.message}`);
      }

      await writeAuditLog(adminEmail, 'ADD_TEAM_MEMBERS', 'team_members', teamData.id, null, {
        member_count: memberRows.length,
        team_id: teamData.id,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

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
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: accentColor || 'var(--cyan)', letterSpacing: '0.08em', marginBottom: '2px' }}>
              Manual Team Registration
            </div>
            <h2 style={{ fontFamily: 'var(--font-subheading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Add New Team
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Event: <code>{eventSlug}</code>
              {teamMax && <span style={{ marginLeft: '10px' }}>Max team size: {teamMax}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '4px' }}
            aria-label="Close"
          >×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {/* Team fields */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Team Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FormField label="Team Name *">
                <input style={inputStyle} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Team Alpha" />
              </FormField>
              <FormField label="College">
                <input style={inputStyle} value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. DBIT" />
              </FormField>
              <FormField label="Payment Status">
                <select style={inputStyle} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                  {PAYMENT_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Members */}
          <div>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Members ({members.length}) — First member is Team Lead</span>
              {teamMax && members.length >= teamMax && (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠ Exceeds max {teamMax}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {members.map((m, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg)',
                  border: `1px solid ${idx === 0 ? (accentColor || 'var(--cyan)') : 'var(--bg-card-border)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: idx === 0 ? (accentColor || 'var(--cyan)') : 'var(--text-muted)' }}>
                      {idx === 0 ? '★ Team Lead (Member 1)' : `Member ${idx + 1}`}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeMemberRow(idx)}
                        style={{
                          fontSize: '0.75rem', padding: '2px 8px', borderRadius: '5px',
                          border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)',
                          color: '#ef4444', cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <FormField label="Name *">
                      <input style={inputStyle} value={m.name} onChange={e => updateMember(idx, 'name', e.target.value)} />
                    </FormField>
                    <FormField label="USN *">
                      <input style={inputStyle} value={m.usn} onChange={e => updateMember(idx, 'usn', e.target.value)} />
                    </FormField>
                    <FormField label="Email">
                      <input style={inputStyle} type="email" value={m.email} onChange={e => updateMember(idx, 'email', e.target.value)} />
                    </FormField>
                    <FormField label="Phone">
                      <input style={inputStyle} type="tel" value={m.phone} onChange={e => updateMember(idx, 'phone', e.target.value)} />
                    </FormField>
                    <FormField label="Department">
                      <select style={inputStyle} value={m.dept} onChange={e => updateMember(idx, 'dept', e.target.value)}>
                        <option value="">— Not specified —</option>
                        {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </FormField>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMemberRow}
              style={{
                marginTop: '12px', width: '100%', padding: '8px',
                borderRadius: '7px', border: '1px dashed var(--bg-card-border)',
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              + Add Another Member
            </button>
          </div>

          {error && <ErrorBox msg={error} />}
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
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '9px 22px', borderRadius: '7px', border: 'none',
              background: 'var(--cyan)', color: '#000', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Creating…' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
}
