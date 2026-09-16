/**
 * WorkshopEditModal.jsx
 * Modal for administrators to edit or delete an individual workshop registrant row.
 * Supports conditional Semester 1 (Roll Number, Cycle, Section, Dept) vs
 * Semester 3/5/7 (USN, Section, Dept) fields, Status toggle, and Audit Logging.
 */
import { useEffect, useState } from 'react';
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
const STATUS_OPTIONS = ['confirmed', 'cancelled'];

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
  maxWidth: '640px',
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
  fontSize: '0.86rem',
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
      marginBottom: '14px',
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

export default function WorkshopEditModal({ registrant, accentColor, onSaved, onClose }) {
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [name, setName] = useState(registrant?.name || '');
  const [email, setEmail] = useState(registrant?.email || '');
  const [phone, setPhone] = useState(registrant?.phone || '');
  const [semester, setSemester] = useState(registrant?.semester ? String(registrant.semester) : '1');
  const [section, setSection] = useState(registrant?.section || '');
  const [usn, setUsn] = useState(registrant?.usn || '');
  const [rollNumber, setRollNumber] = useState(registrant?.roll_number || '');
  const [cycle, setCycle] = useState(registrant?.cycle || '');
  const [selectedDept, setSelectedDept] = useState(registrant?.selected_dept || '');
  const [status, setStatus] = useState(registrant?.status || 'confirmed');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isSem1 = Number(semester) === 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    if (!email.trim() || !isValidEmail(email)) { setError('Valid email address is required.'); return; }
    if (!phone.trim() || !isValidPhone(phone)) { setError('Valid 10-digit phone number is required.'); return; }
    if (!semester) { setError('Semester is required.'); return; }

    const semNum = Number(semester);
    if (semNum === 1) {
      if (!rollNumber.trim()) { setError('Roll Number is required for 1st Semester.'); return; }
      if (!section.trim()) { setError('Section is required for 1st Semester.'); return; }
    } else {
      if (!usn.trim()) { setError('USN is required.'); return; }
      if (!isValidUSN(usn)) { setError('Invalid USN format (e.g. 1DB23CS001).'); return; }
    }

    setSaving(true);
    setError('');

    try {
      const beforeState = {
        name: registrant.name,
        email: registrant.email,
        phone: registrant.phone,
        semester: registrant.semester,
        usn: registrant.usn,
        roll_number: registrant.roll_number,
        cycle: registrant.cycle,
        section: registrant.section,
        selected_dept: registrant.selected_dept,
        status: registrant.status,
      };

      const afterState = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        semester: semNum,
        section: section?.trim() || null,
        status,
        usn: isSem1 ? null : usn.trim().toUpperCase(),
        roll_number: isSem1 ? rollNumber.trim() : null,
        cycle: isSem1 ? (cycle || null) : null,
        selected_dept: selectedDept?.trim() || null,
      };

      const { error: updateErr } = await supabase
        .from('workshop_registrations')
        .update(afterState)
        .eq('id', registrant.id);

      if (updateErr) throw new Error(updateErr.message);

      await writeAuditLog(
        adminEmail,
        'UPDATE_WORKSHOP_REGISTRATION',
        'workshop_registrations',
        registrant.id,
        beforeState,
        afterState
      );

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update workshop registration.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText.trim() !== registrant.name.trim()) {
      setDeleteError('Registrant name does not match. Type it exactly to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const beforeState = {
        name: registrant.name,
        email: registrant.email,
        phone: registrant.phone,
        event_slug: registrant.event_slug,
      };

      const { error: delErr } = await supabase
        .from('workshop_registrations')
        .delete()
        .eq('id', registrant.id);

      if (delErr) throw new Error(delErr.message);

      await writeAuditLog(
        adminEmail,
        'DELETE_WORKSHOP_REGISTRATION',
        'workshop_registrations',
        registrant.id,
        beforeState,
        null
      );

      onSaved();
      onClose();
    } catch (err) {
      setDeleteError(err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={OVERLAY_STYLE} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={MODAL_STYLE}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--bg-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: accentColor || 'var(--cyan)',
              marginBottom: '3px',
            }}>
              Workshop Registration
            </div>
            <h2 style={{
              fontFamily: 'var(--font-subheading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text)',
            }}>
              Edit Registrant: {registrant.name}
            </h2>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Event: <code>{registrant.event_slug}</code> · ID: <code style={{ fontSize: '0.7rem' }}>{registrant.id}</code>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorBox msg={error} />

          {/* Name & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '12px' }}>
            <FormField label="Full Name *">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
                placeholder="Student Name"
              />
            </FormField>

            <FormField label="Registration Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st.toUpperCase()}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Email Address *">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="student@example.com"
              />
            </FormField>

            <FormField label="Phone Number (10 digits) *">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={10}
                style={inputStyle}
                placeholder="9876543210"
              />
            </FormField>
          </div>

          {/* Academic Info */}
          <div style={{
            background: 'var(--bg-alt)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: '2px',
            }}>
              Academic Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Semester *">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={inputStyle}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Section">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Select Section --</option>
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {isSem1 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Roll Number (Sem 1) *">
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 45"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Cycle (Sem 1)">
                    <select
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">-- Select Cycle --</option>
                      {CYCLES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Department / Branch">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Select Branch --</option>
                    {DEPT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            ) : (
              <>
                <FormField label="USN (Sem 3/5/7) *">
                  <input
                    type="text"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    placeholder="1DB23CS001"
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </FormField>

                <FormField label="Department / Branch">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Select Branch (Optional) --</option>
                    {DEPT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}
          </div>

          {/* Delete Section Toggle */}
          <div style={{
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid var(--bg-card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗑 Delete Registrant
              </button>
            ) : (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '14px',
                width: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 700, fontSize: '0.86rem', marginBottom: '6px' }}>
                  <FiAlertTriangle /> Confirm Permanent Deletion
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '0 0 10px 0' }}>
                  Type <strong>{registrant.name}</strong> to delete this workshop registration permanently:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(''); }}
                  placeholder={registrant.name}
                  style={{ ...inputStyle, marginBottom: '10px' }}
                />
                {deleteError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '8px' }}>{deleteError}</div>
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--bg-card-border)',
                      color: 'var(--text-dim)',
                      padding: '6px 12px',
                      borderRadius: '5px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirmText.trim() !== registrant.name.trim()}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '5px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: deleting || deleteConfirmText.trim() !== registrant.name.trim() ? 'not-allowed' : 'pointer',
                      opacity: deleting || deleteConfirmText.trim() !== registrant.name.trim() ? 0.5 : 1,
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            )}

            {!showDeleteConfirm && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--bg-card-border)',
                    color: 'var(--text-dim)',
                    padding: '8px 18px',
                    borderRadius: '7px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: accentColor || 'var(--cyan)',
                    border: 'none',
                    color: '#000',
                    padding: '8px 20px',
                    borderRadius: '7px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
