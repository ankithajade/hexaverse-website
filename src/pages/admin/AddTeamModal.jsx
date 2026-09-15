/**
 * AddTeamModal.jsx
 * Modal to manually create a new team (admin-side, e.g. phone registration).
 * The existing assign_team_short_id trigger handles short_id automatically.
 * Used by both AdminDepartmentPage and AdminMegaEventPage.
 */
import { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from './AdminAuthGate';

// Full department names — must match public registration form
const DEPT_OPTIONS = [
  'Artificial Intelligence & Machine Learning',
  'Artificial Intelligence & Data Science',
  'Computer Science and Engineering',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'IoT and Cybersecurity including Blockchain',
];

// Sem-1 uses the same 7-option list but keyed for the select
const SEM1_DEPT_OPTIONS = DEPT_OPTIONS;

const SEMESTERS    = ['1', '3', '5', '7'];
const SECTIONS     = ['A', 'B', 'C', 'D'];
const CYCLES       = ['Physics Cycle', 'Chemistry Cycle'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'success', 'failed'];

// Base member shape — lead gets extra fields below
const EMPTY_MEMBER = { name: '', usn: '', email: '', phone: '', dept: '' };

// Team-lead shape includes eligibility fields
const EMPTY_LEAD = {
  name: '', usn: '', email: '', phone: '', dept: '',
  semester: '', section: '', cycle: '', selectedDept: '', rollNumber: '',
};

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

const inputErrorStyle = {
  ...inputStyle,
  borderColor: '#ef4444',
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

const inlineErrorStyle = {
  color: '#ef4444',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
};

function FormField({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function InlineError({ msg }) {
  if (!msg) return null;
  return (
    <div style={inlineErrorStyle}>
      <FiAlertTriangle style={{ flexShrink: 0 }} />
      <span>{msg}</span>
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
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Always start with at least one member (Team Lead at index 0)
  const [members, setMembers] = useState([{ ...EMPTY_LEAD }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Track per-member, per-field errors for inline display
  const [memberErrors, setMemberErrors] = useState([{}]);

  const updateMember = (idx, field, value) => {
    setMembers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    // Clear that field's error as user edits
    setMemberErrors(prev => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || {}), [field]: '' };
      return next;
    });
  };

  const addMemberRow = () => {
    setMembers(prev => [...prev, { ...EMPTY_MEMBER }]);
    setMemberErrors(prev => [...prev, {}]);
  };

  const removeMemberRow = (idx) => {
    if (members.length <= 1) return;
    setMembers(prev => prev.filter((_, i) => i !== idx));
    setMemberErrors(prev => prev.filter((_, i) => i !== idx));
  };

  const isHighSem = (sem) => ['3', '5', '7'].includes(sem);

  const handleSubmit = async () => {
    // ── Validation ──
    const newMemberErrors = members.map((m, idx) => {
      const errs = {};
      if (!m.name?.trim()) errs.name = 'Name is required.';
      // Lead sem 1 uses rollNumber; lead sem 3/5/7 and other members use USN
      const isSem1Lead = idx === 0 && m.semester === '1';
      if (isSem1Lead) {
        if (!m.rollNumber?.trim()) errs.rollNumber = 'Roll number is required.';
        if (!m.cycle) errs.cycle = 'Cycle is required.';
        if (!m.selectedDept) errs.selectedDept = 'Department is required.';
      } else {
        if (!m.usn?.trim()) errs.usn = 'USN is required.';
      }
      if (idx === 0 && !m.semester) errs.semester = 'Semester is required.';
      if (idx === 0 && isHighSem(m.semester) && !m.section) errs.section = 'Section is required.';
      if (!m.phone?.trim()) errs.phone = 'Phone is required.';
      return errs;
    });

    setMemberErrors(newMemberErrors);

    const hasErrors = newMemberErrors.some(e => Object.keys(e).length > 0);
    if (!teamName.trim()) { setError('Team name is required.'); return; }
    if (hasErrors) { setError('Please fix the errors highlighted below.'); return; }

    setSaving(true);
    setError('');

    const lead = members[0];
    const isSem1 = lead.semester === '1';

    try {
      // 1. Insert team — trigger assigns short_id automatically
      const { data: teamData, error: teamErr } = await supabase.from('teams').insert({
        event_slug: eventSlug,
        team_name: teamName.trim(),
        payment_status: paymentStatus,
        team_size: members.length,
        // Eligibility fields from Team Lead
        semester: lead.semester || null,
        section: isHighSem(lead.semester) ? (lead.section || null) : null,
        usn: !isSem1 ? (lead.usn?.trim().toUpperCase() || null) : null,
        cycle: isSem1 ? (lead.cycle || null) : null,
        selected_dept: isSem1 ? (lead.selectedDept || null) : null,
        roll_number: isSem1 ? (lead.rollNumber?.trim() || null) : null,
      }).select().single();

      if (teamErr) throw new Error(`Failed to create team: ${teamErr.message}`);

      await writeAuditLog(adminEmail, 'ADD_TEAM', 'teams', teamData.id, null, {
        team_name: teamData.team_name,
        event_slug: eventSlug,
        payment_status: teamData.payment_status,
      });

      // 2. Insert members
      const memberRows = members.map((m, idx) => {
        const isSem1Lead = idx === 0 && isSem1;
        return {
          team_id: teamData.id,
          is_lead: idx === 0,
          name: m.name.trim(),
          usn: !isSem1Lead ? (m.usn?.trim().toUpperCase() || null) : null,
          roll_number: isSem1Lead ? (m.rollNumber?.trim() || null) : null,
          email: m.email?.trim().toLowerCase() || null,
          phone: m.phone?.trim() || null,
          dept: m.dept?.trim() || null,
          position: idx + 1,
        };
      });

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Team Name *">
                <input style={inputStyle} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Team Alpha" />
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
                <span style={{ color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiAlertTriangle />Exceeds max {teamMax}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {members.map((m, idx) => {
                const errs = memberErrors[idx] || {};
                const isLead = idx === 0;
                const sem1 = isLead && m.semester === '1';
                const highSem = isLead && isHighSem(m.semester);

                return (
                  <div key={idx} style={{
                    background: 'var(--bg)',
                    border: `1px solid ${isLead ? (accentColor || 'var(--cyan)') : 'var(--bg-card-border)'}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                  }}>
                    {/* Row header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isLead ? (accentColor || 'var(--cyan)') : 'var(--text-muted)' }}>
                        {isLead ? '★ Team Lead (Member 1)' : `Member ${idx + 1}`}
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

                    {/* ── Common fields: Name, Email, Phone ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <FormField label="Name *">
                        <InlineError msg={errs.name} />
                        <input
                          style={errs.name ? inputErrorStyle : inputStyle}
                          value={m.name}
                          onChange={e => updateMember(idx, 'name', e.target.value)}
                        />
                      </FormField>
                      <FormField label="Email">
                        <input
                          style={inputStyle}
                          type="email"
                          value={m.email}
                          onChange={e => updateMember(idx, 'email', e.target.value)}
                        />
                      </FormField>
                      <FormField label="Phone *">
                        <InlineError msg={errs.phone} />
                        <input
                          style={errs.phone ? inputErrorStyle : inputStyle}
                          type="tel"
                          value={m.phone}
                          onChange={e => updateMember(idx, 'phone', e.target.value)}
                          placeholder="10-digit mobile"
                        />
                      </FormField>

                      {/* Non-lead: USN + Department in same row */}
                      {!isLead && (
                        <>
                          <FormField label="USN *">
                            <InlineError msg={errs.usn} />
                            <input
                              style={errs.usn ? inputErrorStyle : inputStyle}
                              value={m.usn}
                              onChange={e => updateMember(idx, 'usn', e.target.value.toUpperCase())}
                              placeholder="1DB23XX000"
                            />
                          </FormField>
                          <FormField label="Department">
                            <select style={inputStyle} value={m.dept} onChange={e => updateMember(idx, 'dept', e.target.value)}>
                              <option value="">— Not specified —</option>
                              {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </FormField>
                        </>
                      )}
                    </div>

                    {/* ── Team Lead extra fields ── */}
                    {isLead && (
                      <>
                        {/* Semester + conditional USN or Roll Number + Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <FormField label="Semester *">
                            <InlineError msg={errs.semester} />
                            <select
                              style={errs.semester ? inputErrorStyle : inputStyle}
                              value={m.semester}
                              onChange={e => updateMember(idx, 'semester', e.target.value)}
                            >
                              <option value="">— Select —</option>
                              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                          </FormField>

                          {/* High sem: USN + Section */}
                          {highSem && (
                            <>
                              <FormField label="USN *">
                                <InlineError msg={errs.usn} />
                                <input
                                  style={errs.usn ? inputErrorStyle : inputStyle}
                                  value={m.usn}
                                  onChange={e => updateMember(idx, 'usn', e.target.value.toUpperCase())}
                                  placeholder="1DB23XX000"
                                />
                              </FormField>
                              <FormField label="Section *">
                                <InlineError msg={errs.section} />
                                <select
                                  style={errs.section ? inputErrorStyle : inputStyle}
                                  value={m.section}
                                  onChange={e => updateMember(idx, 'section', e.target.value)}
                                >
                                  <option value="">— Select —</option>
                                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </FormField>
                            </>
                          )}

                          {/* Sem 1: Roll Number */}
                          {sem1 && (
                            <FormField label="Roll Number *">
                              <InlineError msg={errs.rollNumber} />
                              <input
                                style={errs.rollNumber ? inputErrorStyle : inputStyle}
                                value={m.rollNumber}
                                onChange={e => updateMember(idx, 'rollNumber', e.target.value)}
                                placeholder="e.g. 24"
                              />
                            </FormField>
                          )}

                          {/* No sem selected: placeholder to keep grid consistent */}
                          {!m.semester && <div />}
                        </div>

                        {/* Sem 1: Cycle + Department */}
                        {sem1 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <FormField label="Cycle *">
                              <InlineError msg={errs.cycle} />
                              <select
                                style={errs.cycle ? inputErrorStyle : inputStyle}
                                value={m.cycle}
                                onChange={e => updateMember(idx, 'cycle', e.target.value)}
                              >
                                <option value="">— Select —</option>
                                {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </FormField>
                            <FormField label="Department *">
                              <InlineError msg={errs.selectedDept} />
                              <select
                                style={errs.selectedDept ? inputErrorStyle : inputStyle}
                                value={m.selectedDept}
                                onChange={e => updateMember(idx, 'selectedDept', e.target.value)}
                              >
                                <option value="">— Select —</option>
                                {SEM1_DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </FormField>
                          </div>
                        )}

                        {/* Lead department (always shown for non-sem1, or as alt dept for sem1) */}
                        {!sem1 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                            <FormField label="Department">
                              <select style={inputStyle} value={m.dept} onChange={e => updateMember(idx, 'dept', e.target.value)}>
                                <option value="">— Not specified —</option>
                                {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </FormField>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
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
