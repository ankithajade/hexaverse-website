/**
 * AddWorkshopRegistrantModal.jsx
 * Modal for administrators to manually register an attendee for a department workshop.
 * Supports conditional Semester 1 (Roll Number, Cycle, Section, Dept) vs
 * Semester 3/5/7 (USN, Section, Dept) fields, Status default, and Audit Logging.
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

export default function AddWorkshopRegistrantModal({ eventSlug, accentColor, onSaved, onClose }) {
  const { session } = useAdminSession();
  const adminEmail = session?.user?.email || 'unknown';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');
  const [usn, setUsn] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [cycle, setCycle] = useState('Physics Cycle');
  const [selectedDept, setSelectedDept] = useState('');
  const [status, setStatus] = useState('confirmed');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isSem1 = Number(semester) === 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) { setError('Name is required.'); return; }
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
      const payload = {
        event_slug: eventSlug,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        semester: semNum,
        status: status || 'confirmed',
        section: section?.trim() || null,
        usn: isSem1 ? null : usn.trim().toUpperCase(),
        roll_number: isSem1 ? rollNumber.trim() : null,
        cycle: isSem1 ? (cycle || null) : null,
        selected_dept: selectedDept?.trim() || null,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('workshop_registrations')
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);

      await writeAuditLog(
        adminEmail,
        'ADD_WORKSHOP_REGISTRATION',
        'workshop_registrations',
        inserted.id,
        null,
        payload
      );

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add workshop registration.');
    } finally {
      setSaving(false);
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
              Manual Workshop Entry
            </div>
            <h2 style={{
              fontFamily: 'var(--font-subheading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text)',
            }}>
              Add Workshop Registrant
            </h2>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Target Event: <code>{eventSlug}</code>
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
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                autoFocus
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

          {/* Actions */}
          <div style={{
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid var(--bg-card-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}>
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
              {saving ? 'Adding…' : 'Add Registrant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
