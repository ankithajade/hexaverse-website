/**
 * TeamEditModal.jsx
 * Full-featured modal for administrators to edit a team row and all its members.
 * Supports per-member Semester, Section, Cycle/Roll Number (Sem 1) or USN (Sem 3/5/7),
 * Phone, Email, and Department.
 */
import { useEffect, useState } from 'react';
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

const EMPTY_NEW_MEMBER = {
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
  background: 'rgba(0,0,0,0.75)',
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
  maxWidth: '780px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
};

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '6px',
  border: '1px solid var(--bg-card-border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.84rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
  marginBottom: '3px',
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
      marginBottom: '10px',
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

export default function TeamEditModal({ team, eventSlug, teamMin, teamMax, accentColor, onSaved, onClose }) {
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [teamName, setTeamName] = useState(team.team_name || '');
  const [paymentStatus, setPaymentStatus] = useState(team.payment_status || 'pending');

  const [members, setMembers] = useState(() =>
    [...(team.team_members || [])].sort((a, b) => (a.position || 0) - (b.position || 0))
  );

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_NEW_MEMBER);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSaving, setAddMemberSaving] = useState(false);

  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [memberDeleteError, setMemberDeleteError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const updateMemberField = (idx, field, value) => {
    setMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const setLead = (idx) => {
    setMembers((prev) => prev.map((m, i) => ({ ...m, is_lead: i === idx })));
  };

  const handleSaveAll = async () => {
    if (!teamName.trim()) { setSaveError('Team name cannot be empty.'); return; }

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const role = m.is_lead ? 'Team Lead' : `Member ${i + 1}`;

      if (!m.name?.trim()) { setSaveError(`${role} name cannot be empty.`); return; }
      if (!m.phone?.trim()) { setSaveError(`${role} phone number is required.`); return; }
      if (!isValidPhone(m.phone)) { setSaveError(`${role} phone number must be 10 digits.`); return; }

      if (m.is_lead) {
        if (!m.email?.trim()) { setSaveError('Team Lead email is required.'); return; }
        if (!isValidEmail(m.email)) { setSaveError('Team Lead has an invalid email.'); return; }
      } else if (m.email?.trim() && !isValidEmail(m.email)) {
        setSaveError(`${role} has an invalid email.`); return;
      }

      if (!m.semester) { setSaveError(`${role} semester is required.`); return; }
      if (!m.section) { setSaveError(`${role} section is required.`); return; }

      const semNum = Number(m.semester);
      if (semNum === 1) {
        if (!m.roll_number?.trim()) { setSaveError(`${role} roll number is required.`); return; }
        if (!m.cycle) { setSaveError(`${role} cycle is required.`); return; }
        if (!m.dept) { setSaveError(`${role} department is required.`); return; }
      } else if ([3, 5, 7].includes(semNum)) {
        if (!m.usn?.trim()) { setSaveError(`${role} USN is required.`); return; }
        if (!isValidUSN(m.usn)) { setSaveError(`${role} has an invalid USN format.`); return; }
        if (!m.dept) { setSaveError(`${role} department is required.`); return; }
      }
    }

    setSaving(true);
    setSaveError('');

    try {
      const beforeTeam = { team_name: team.team_name, payment_status: team.payment_status };
      const afterTeam = { team_name: teamName.trim(), payment_status: paymentStatus };

      const { error: teamErr } = await supabase.from('teams').update({
        team_name: teamName.trim(),
        payment_status: paymentStatus,
        team_size: members.length,
      }).eq('id', team.id);

      if (teamErr) throw new Error(`Team update failed: ${teamErr.message}`);

      await writeAuditLog(adminEmail, 'UPDATE_TEAM', 'teams', team.id, beforeTeam, afterTeam);

      for (const m of members) {
        const semNum = Number(m.semester);
        const isSem1 = semNum === 1;

        const { error: mErr } = await supabase.from('team_members').update({
          name: m.name?.trim() || m.name,
          semester: semNum || null,
          section: m.section?.trim() || null,
          dept: m.dept?.trim() || null,
          cycle: isSem1 ? (m.cycle || null) : null,
          roll_number: isSem1 ? (m.roll_number?.trim() || null) : null,
          usn: isSem1 ? null : (m.usn?.trim().toUpperCase() || null),
          email: m.email?.trim().toLowerCase() || null,
          phone: m.phone?.trim() || null,
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

  const handleDeleteMember = async (memberId) => {
    const minAllowed = teamMin != null ? Number(teamMin) : 1;
    const resultingSize = members.length - 1;
    if (resultingSize < minAllowed) {
      setMemberDeleteError(
        `Cannot delete member. Minimum ${minAllowed} member${minAllowed > 1 ? 's' : ''} required for this event.`
      );
      return;
    }

    setDeletingMemberId(memberId);
    setMemberDeleteError('');
    try {
      const memberBefore = members.find((m) => m.id === memberId);
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw new Error(error.message);

      await writeAuditLog(adminEmail, 'DELETE_MEMBER', 'team_members', memberId, memberBefore, null);

      const nextMembers = members.filter((m) => m.id !== memberId);
      setMembers(nextMembers);
      await supabase.from('teams').update({ team_size: nextMembers.length }).eq('id', team.id);
      onSaved();
    } catch (err) {
      setMemberDeleteError(`Delete failed: ${err.message}`);
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleAddMember = async () => {
    const maxAllowed = teamMax != null ? Number(teamMax) : null;
    const resultingSize = members.length + 1;
    if (maxAllowed != null && resultingSize > maxAllowed) {
      setAddMemberError(`Cannot add member. Maximum ${maxAllowed} members allowed for this event.`);
      return;
    }

    if (!newMember.name.trim()) {
      setAddMemberError('Member name is required.');
      return;
    }
    if (!newMember.phone.trim() || !isValidPhone(newMember.phone)) {
      setAddMemberError('Valid 10-digit phone number is required.');
      return;
    }
    if (!newMember.semester) {
      setAddMemberError('Semester is required.');
      return;
    }
    if (!newMember.section) {
      setAddMemberError('Section is required.');
      return;
    }

    const semNum = Number(newMember.semester);
    const isSem1 = semNum === 1;

    if (isSem1) {
      if (!newMember.rollNumber?.trim()) { setAddMemberError('Roll number is required.'); return; }
      if (!newMember.cycle) { setAddMemberError('Cycle is required.'); return; }
      if (!newMember.dept) { setAddMemberError('Department is required.'); return; }
    } else if ([3, 5, 7].includes(semNum)) {
      if (!newMember.usn?.trim() || !isValidUSN(newMember.usn)) {
        setAddMemberError('Valid USN format is required.'); return;
      }
      if (!newMember.dept) { setAddMemberError('Department is required.'); return; }
    }

    setAddMemberSaving(true);
    setAddMemberError('');

    try {
      const nextPosition = members.length > 0 ? Math.max(...members.map((m) => m.position || 0)) + 1 : 1;
      const memberPayload = {
        team_id: team.id,
        is_lead: members.length === 0,
        name: newMember.name.trim(),
        semester: semNum,
        section: newMember.section.trim(),
        dept: newMember.dept.trim(),
        cycle: isSem1 ? newMember.cycle : null,
        roll_number: isSem1 ? newMember.rollNumber.trim() : null,
        usn: isSem1 ? null : newMember.usn.trim().toUpperCase(),
        email: newMember.email?.trim().toLowerCase() || null,
        phone: newMember.phone.trim(),
        position: nextPosition,
      };

      const { data: inserted, error } = await supabase
        .from('team_members')
        .insert(memberPayload)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAuditLog(adminEmail, 'ADD_MEMBER', 'team_members', inserted.id, null, memberPayload);

      const nextMembers = [...members, inserted];
      setMembers(nextMembers);
      await supabase.from('teams').update({ team_size: nextMembers.length }).eq('id', team.id);

      setNewMember(EMPTY_NEW_MEMBER);
      setShowAddMember(false);
      onSaved();
    } catch (err) {
      setAddMemberError(`Failed to add member: ${err.message}`);
    } finally {
      setAddMemberSaving(false);
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
              Admin Operations
            </div>
            <h2 style={{ fontFamily: 'var(--font-subheading)', margin: '4px 0 0', color: 'var(--text)', fontSize: '1.25rem' }}>
              Edit Team · <span style={{ color: 'var(--cyan)' }}>{team.team_name}</span>
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
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <ErrorBox msg={saveError} />
          <ErrorBox msg={memberDeleteError} />

          {/* Section 1: Team Settings */}
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
              Team Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <FormField label="Team Name">
                <input
                  style={inputStyle}
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

          {/* Section 2: Members List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Members ({members.length})
              </div>
              <button
                type="button"
                onClick={() => { setShowAddMember(!showAddMember); setAddMemberError(''); }}
                style={{
                  fontSize: '0.78rem', padding: '5px 12px', borderRadius: '5px',
                  border: '1px solid var(--bg-card-border)', background: 'var(--bg)',
                  color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {showAddMember ? 'Cancel Add' : '+ Add Member'}
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.04)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)' }}>
                  New Team Member
                </div>
                <ErrorBox msg={addMemberError} />

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px' }}>
                  <FormField label="Name *">
                    <input
                      style={inputStyle}
                      placeholder="Participant Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Phone (10 digits) *">
                    <input
                      style={inputStyle}
                      placeholder="10-digit mobile"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Email">
                    <input
                      style={inputStyle}
                      placeholder="email@dbit.edu.in"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '10px' }}>
                  <FormField label="Semester *">
                    <select
                      style={inputStyle}
                      value={newMember.semester}
                      onChange={(e) => setNewMember({ ...newMember, semester: e.target.value })}
                    >
                      <option value="">Select Sem</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Section *">
                    <select
                      style={inputStyle}
                      value={newMember.section}
                      onChange={(e) => setNewMember({ ...newMember, section: e.target.value })}
                    >
                      <option value="">Select Sec</option>
                      {SECTIONS.map((sec) => (
                        <option key={sec} value={sec}>Sec {sec}</option>
                      ))}
                    </select>
                  </FormField>

                  {Number(newMember.semester) === 1 ? (
                    <FormField label="Roll Number *">
                      <input
                        style={inputStyle}
                        placeholder="e.g. 24CS01"
                        value={newMember.rollNumber}
                        onChange={(e) => setNewMember({ ...newMember, rollNumber: e.target.value })}
                      />
                    </FormField>
                  ) : (
                    <FormField label="USN *">
                      <input
                        style={inputStyle}
                        placeholder="1DB23..."
                        value={newMember.usn}
                        onChange={(e) => setNewMember({ ...newMember, usn: e.target.value })}
                      />
                    </FormField>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: Number(newMember.semester) === 1 ? '1fr 2fr' : '1fr', gap: '10px' }}>
                  {Number(newMember.semester) === 1 && (
                    <FormField label="Cycle *">
                      <select
                        style={inputStyle}
                        value={newMember.cycle}
                        onChange={(e) => setNewMember({ ...newMember, cycle: e.target.value })}
                      >
                        <option value="">Select Cycle</option>
                        {CYCLES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </FormField>
                  )}

                  <FormField label="Department *">
                    <select
                      style={inputStyle}
                      value={newMember.dept}
                      onChange={(e) => setNewMember({ ...newMember, dept: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {DEPT_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    style={{
                      fontSize: '0.78rem', padding: '6px 12px', borderRadius: '5px',
                      border: '1px solid var(--bg-card-border)', background: 'var(--bg)',
                      color: 'var(--text-dim)', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={addMemberSaving}
                    style={{
                      fontSize: '0.78rem', padding: '6px 16px', borderRadius: '5px',
                      border: 'none', background: 'var(--cyan)', color: '#000',
                      cursor: 'pointer', fontWeight: 700,
                    }}
                  >
                    {addMemberSaving ? 'Saving...' : 'Add Member'}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Member Cards */}
            {members.map((m, idx) => {
              const semNum = Number(m.semester);
              const isSem1 = semNum === 1;

              return (
                <div
                  key={m.id || idx}
                  style={{
                    background: 'var(--bg)',
                    border: m.is_lead ? '1px solid var(--cyan)' : '1px solid var(--bg-card-border)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: m.is_lead ? 'var(--cyan)' : 'var(--text)' }}>
                        {m.is_lead ? '★ Team Lead' : `Member ${idx + 1}`}
                      </span>
                      {!m.is_lead && (
                        <button
                          type="button"
                          onClick={() => setLead(idx)}
                          style={{
                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px',
                            border: '1px solid var(--bg-card-border)', background: 'var(--bg-card)',
                            color: 'var(--text-muted)', cursor: 'pointer',
                          }}
                        >
                          Make Lead
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.id)}
                      disabled={deletingMemberId === m.id}
                      style={{
                        background: 'none', border: 'none', color: '#ef4444',
                        fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      {deletingMemberId === m.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  {/* Name */}
                  <FormField label="Full Name">
                    <input
                      style={inputStyle}
                      value={m.name || ''}
                      onChange={(e) => updateMemberField(idx, 'name', e.target.value)}
                    />
                  </FormField>

                  {/* Phone + Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <FormField label="Phone (10 digits)">
                      <input
                        style={inputStyle}
                        value={m.phone || ''}
                        onChange={(e) => updateMemberField(idx, 'phone', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Email">
                      <input
                        style={inputStyle}
                        value={m.email || ''}
                        onChange={(e) => updateMemberField(idx, 'email', e.target.value)}
                      />
                    </FormField>
                  </div>

                  {/* Semester + Section + USN / Roll Number */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '10px' }}>
                    <FormField label="Semester">
                      <select
                        style={inputStyle}
                        value={m.semester || ''}
                        onChange={(e) => updateMemberField(idx, 'semester', e.target.value)}
                      >
                        <option value="">Select Sem</option>
                        {SEMESTERS.map((s) => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Section">
                      <select
                        style={inputStyle}
                        value={m.section || ''}
                        onChange={(e) => updateMemberField(idx, 'section', e.target.value)}
                      >
                        <option value="">Select Sec</option>
                        {SECTIONS.map((sec) => (
                          <option key={sec} value={sec}>Sec {sec}</option>
                        ))}
                      </select>
                    </FormField>

                    {isSem1 ? (
                      <FormField label="Roll Number">
                        <input
                          style={inputStyle}
                          value={m.roll_number || m.rollNumber || ''}
                          onChange={(e) => updateMemberField(idx, 'roll_number', e.target.value)}
                        />
                      </FormField>
                    ) : (
                      <FormField label="USN">
                        <input
                          style={inputStyle}
                          value={m.usn || ''}
                          onChange={(e) => updateMemberField(idx, 'usn', e.target.value)}
                        />
                      </FormField>
                    )}
                  </div>

                  {/* Cycle (if Sem 1) + Department */}
                  <div style={{ display: 'grid', gridTemplateColumns: isSem1 ? '1fr 2fr' : '1fr', gap: '10px' }}>
                    {isSem1 && (
                      <FormField label="Cycle">
                        <select
                          style={inputStyle}
                          value={m.cycle || ''}
                          onChange={(e) => updateMemberField(idx, 'cycle', e.target.value)}
                        >
                          <option value="">Select Cycle</option>
                          {CYCLES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </FormField>
                    )}

                    <FormField label="Department">
                      <select
                        style={inputStyle}
                        value={m.dept || ''}
                        onChange={(e) => updateMemberField(idx, 'dept', e.target.value)}
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
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: 'none',
              background: accentColor || 'var(--cyan)', color: '#000', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
