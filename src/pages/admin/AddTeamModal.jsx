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
import { isValidUSN, isValidPhone, isValidEmail } from '../../lib/validators';

const DEPT_OPTIONS = [
  'Artificial Intelligence & Machine Learning',
  'Artificial Intelligence & Data Science',
  'Computer Science and Engineering',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'IoT and Cybersecurity including Blockchain',
];

const SEMESTERS = ['1', '3', '5', '7'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const CYCLES = ['Physics Cycle', 'Chemistry Cycle'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'success', 'failed'];

const EMPTY_MEMBER = {
  name: '',
  usn: '',
  email: '',
  phone: '',
  dept: '',
  semester: '',
  section: '',
  cycle: '',
  rollNumber: '',
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

export default function AddTeamModal({ eventSlug, teamMax, accentColor, onSaved, onClose }) {
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [teamName, setTeamName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [members, setMembers] = useState([{ ...EMPTY_MEMBER }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberErrors, setMemberErrors] = useState([{}]);

  const updateMember = (idx, field, value) => {
    setMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    setMemberErrors((prev) => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || {}), [field]: '' };
      return next;
    });
  };

  const addMemberRow = () => {
    setMembers((prev) => [...prev, { ...EMPTY_MEMBER }]);
    setMemberErrors((prev) => [...prev, {}]);
  };

  const removeMemberRow = (idx) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
    setMemberErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const newMemberErrors = members.map((m, idx) => {
      const errs = {};
      const role = idx === 0 ? 'Team Lead' : `Member ${idx + 1}`;

      if (!m.name?.trim()) errs.name = `${role} name is required.`;

      if (!m.phone?.trim()) {
        errs.phone = `${role} phone is required.`;
      } else if (!isValidPhone(m.phone)) {
        errs.phone = 'Valid 10-digit number required.';
      }

      if (idx === 0) {
        if (!m.email?.trim()) {
          errs.email = 'Lead email is required.';
        } else if (!isValidEmail(m.email)) {
          errs.email = 'Valid email required.';
        }
      } else if (m.email?.trim() && !isValidEmail(m.email)) {
        errs.email = 'Valid email required.';
      }

      if (!m.semester) errs.semester = 'Semester is required.';
      if (!m.section) errs.section = 'Section is required.';

      const semNum = Number(m.semester);
      if (semNum === 1) {
        if (!m.rollNumber?.trim()) errs.rollNumber = 'Roll number is required.';
        if (!m.cycle) errs.cycle = 'Cycle is required.';
        if (!m.dept) errs.dept = 'Department is required.';
      } else if ([3, 5, 7].includes(semNum)) {
        if (!m.usn?.trim()) {
          errs.usn = 'USN is required.';
        } else if (!isValidUSN(m.usn)) {
          errs.usn = 'Valid USN format required.';
        }
        if (!m.dept) errs.dept = 'Department is required.';
      }

      return errs;
    });

    setMemberErrors(newMemberErrors);

    const hasErrors = newMemberErrors.some((e) => Object.keys(e).length > 0);
    if (!teamName.trim()) { setError('Team name is required.'); return; }
    if (hasErrors) { setError('Please fix the errors highlighted below.'); return; }

    setSaving(true);
    setError('');

    try {
      // 1. Insert team (trigger assigns short_id)
      const { data: teamData, error: teamErr } = await supabase.from('teams').insert({
        event_slug: eventSlug,
        team_name: teamName.trim(),
        payment_status: paymentStatus,
        team_size: members.length,
        college: 'DBIT',
      }).select().single();

      if (teamErr) throw new Error(`Failed to create team: ${teamErr.message}`);

      // 2. Insert team members with full per-member details
      const memberRows = members.map((m, idx) => {
        const semNum = Number(m.semester);
        const isSem1 = semNum === 1;

        return {
          team_id: teamData.id,
          is_lead: idx === 0,
          name: m.name.trim(),
          semester: semNum,
          section: m.section ? m.section.trim() : null,
          dept: m.dept ? m.dept.trim() : null,
          cycle: isSem1 ? (m.cycle || null) : null,
          roll_number: isSem1 ? (m.rollNumber?.trim() || null) : null,
          usn: isSem1 ? null : (m.usn?.trim().toUpperCase() || null),
          email: m.email?.trim() ? m.email.trim().toLowerCase() : null,
          phone: m.phone.trim(),
          position: idx + 1,
        };
      });

      const { error: memErr } = await supabase.from('team_members').insert(memberRows);

      if (memErr) {
        // Rollback team creation if members fail
        await supabase.from('teams').delete().eq('id', teamData.id);
        throw new Error(`Failed to save members: ${memErr.message}`);
      }

      await writeAuditLog(adminEmail, 'CREATE_TEAM', 'teams', teamData.id, null, {
        team_name: teamName,
        payment_status: paymentStatus,
        members: memberRows,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save team.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={OVERLAY_STYLE} onClick={onClose}>
      <div style={MODAL_STYLE} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--bg-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: accentColor || 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Manual Registration
            </div>
            <h2 style={{ fontFamily: 'var(--font-subheading)', margin: '4px 0 0', color: 'var(--text)', fontSize: '1.25rem' }}>
              Add Team
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorBox msg={error} />

          {/* Team Level Info */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Team Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <FormField label="Team Name *">
                <input
                  style={inputStyle}
                  placeholder="e.g. CodeWarriors"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </FormField>

              <FormField label="Payment Status">
                <select
                  style={inputStyle}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Members List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Team Members ({members.length})
              </div>
              <button
                type="button"
                onClick={addMemberRow}
                style={{
                  fontSize: '0.78rem', padding: '5px 12px', borderRadius: '5px',
                  border: '1px solid var(--bg-card-border)', background: 'var(--bg)',
                  color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600,
                }}
              >
                + Add Member
              </button>
            </div>

            {members.map((m, idx) => {
              const errs = memberErrors[idx] || {};
              const semNum = Number(m.semester);
              const isSem1 = semNum === 1;
              const isHighSem = [3, 5, 7].includes(semNum);

              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--bg-card-border)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: idx === 0 ? 'var(--cyan)' : 'var(--text)' }}>
                      {idx === 0 ? '★ Team Lead' : `Member ${idx + 1}`}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeMemberRow(idx)}
                        style={{
                          background: 'none', border: 'none', color: '#ef4444',
                          fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <FormField label="Full Name *">
                    <InlineError msg={errs.name} />
                    <input
                      style={{ ...inputStyle, borderColor: errs.name ? '#ef4444' : undefined }}
                      placeholder="Participant Name"
                      value={m.name}
                      onChange={(e) => updateMember(idx, 'name', e.target.value)}
                    />
                  </FormField>

                  {/* Phone + Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <FormField label="Phone (10 digits) *">
                      <InlineError msg={errs.phone} />
                      <input
                        style={{ ...inputStyle, borderColor: errs.phone ? '#ef4444' : undefined }}
                        placeholder="10-digit mobile"
                        value={m.phone}
                        onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                      />
                    </FormField>

                    <FormField label={idx === 0 ? 'Email *' : 'Email (Optional)'}>
                      <InlineError msg={errs.email} />
                      <input
                        style={{ ...inputStyle, borderColor: errs.email ? '#ef4444' : undefined }}
                        placeholder="email@domain.com"
                        value={m.email}
                        onChange={(e) => updateMember(idx, 'email', e.target.value)}
                      />
                    </FormField>
                  </div>

                  {/* Semester + Section + USN / Roll Number */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '10px' }}>
                    <FormField label="Semester *">
                      <InlineError msg={errs.semester} />
                      <select
                        style={{ ...inputStyle, borderColor: errs.semester ? '#ef4444' : undefined }}
                        value={m.semester}
                        onChange={(e) => updateMember(idx, 'semester', e.target.value)}
                      >
                        <option value="">Select Sem</option>
                        {SEMESTERS.map((s) => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Section *">
                      <InlineError msg={errs.section} />
                      <select
                        style={{ ...inputStyle, borderColor: errs.section ? '#ef4444' : undefined }}
                        value={m.section}
                        onChange={(e) => updateMember(idx, 'section', e.target.value)}
                      >
                        <option value="">Select Sec</option>
                        {SECTIONS.map((sec) => (
                          <option key={sec} value={sec}>Sec {sec}</option>
                        ))}
                      </select>
                    </FormField>

                    {isHighSem ? (
                      <FormField label="USN *">
                        <InlineError msg={errs.usn} />
                        <input
                          style={{ ...inputStyle, borderColor: errs.usn ? '#ef4444' : undefined }}
                          placeholder="1DB23..."
                          value={m.usn}
                          onChange={(e) => updateMember(idx, 'usn', e.target.value)}
                        />
                      </FormField>
                    ) : isSem1 ? (
                      <FormField label="Roll Number *">
                        <InlineError msg={errs.rollNumber} />
                        <input
                          style={{ ...inputStyle, borderColor: errs.rollNumber ? '#ef4444' : undefined }}
                          placeholder="e.g. 24CS01"
                          value={m.rollNumber}
                          onChange={(e) => updateMember(idx, 'rollNumber', e.target.value)}
                        />
                      </FormField>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* Cycle (if Sem 1) & Department */}
                  <div style={{ display: 'grid', gridTemplateColumns: isSem1 ? '1fr 2fr' : '1fr', gap: '10px' }}>
                    {isSem1 && (
                      <FormField label="Cycle *">
                        <InlineError msg={errs.cycle} />
                        <select
                          style={{ ...inputStyle, borderColor: errs.cycle ? '#ef4444' : undefined }}
                          value={m.cycle}
                          onChange={(e) => updateMember(idx, 'cycle', e.target.value)}
                        >
                          <option value="">Select Cycle</option>
                          {CYCLES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </FormField>
                    )}

                    <FormField label="Department *">
                      <InlineError msg={errs.dept} />
                      <select
                        style={{ ...inputStyle, borderColor: errs.dept ? '#ef4444' : undefined }}
                        value={m.dept}
                        onChange={(e) => updateMember(idx, 'dept', e.target.value)}
                      >
                        <option value="">Select Department</option>
                        {DEPT_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--bg-card-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--bg-card-border)',
              background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.88rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: 'none',
              background: accentColor || 'var(--cyan)', color: '#000', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem',
            }}
          >
            {saving ? 'Saving...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
}
