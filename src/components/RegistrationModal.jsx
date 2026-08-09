import { useEffect, useRef, useState } from 'react';
import { useModal } from '../context/ModalContext';
import { isValidUSN, isValidEmail, isValidPhone } from '../lib/validators';
import { supabase } from '../lib/supabaseClient';

const DEPARTMENTS = ['AI & ML', 'AI & DS', 'CSE', 'ISE', 'ECE', 'EEE'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const EMPTY_FORM = {
  name: '',
  usn: '',
  email: '',
  dept: '',
  year: '',
  phone: '',
  college: '',
  teamName: '',
  semester: '3',
};

const EMPTY_MEMBER = { name: '', usn: '', email: '', dept: '', phone: '' };

export default function RegistrationModal() {
  const {
    isOpen,
    eventId,
    eventSlug,
    eventTitle,
    isTeam,
    isInterCollege,
    teamMin: contextMin,
    teamMax: contextMax,
    closeModal,
  } = useModal();

  const slug = eventSlug || eventId;
  const isWorkshop = slug.endsWith('-workshop');

  // Event config state (fetched from Supabase or fallback)
  const [eventConfig, setEventConfig] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [members, setMembers] = useState([]);
  const [teamNameAvailable, setTeamNameAvailable] = useState(null);
  const [checkingTeamName, setCheckingTeamName] = useState(false);

  // Flow states: 'form' | 'submitting' | 'payment_checkout' | 'verifying_payment' | 'success'
  const [step, setStep] = useState('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  const overlayRef = useRef(null);

  // Fetch event config from Supabase (or fallback) on open
  useEffect(() => {
    if (!isOpen) return;

    setForm(EMPTY_FORM);
    setMembers([]);
    setStep('form');
    setErrorMsg('');
    setTeamNameAvailable(null);
    setPaymentData(null);

    let isMounted = true;
    async function loadEvent() {
      try {
        const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
        if (isMounted && data) {
          setEventConfig(data);
          if (data.is_team && data.team_min) {
            // Pre-populate required additional members to hit team_min
            const neededAddl = Math.max(0, data.team_min - 1);
            setMembers(Array.from({ length: neededAddl }, () => ({ ...EMPTY_MEMBER })));
          }
        }
      } catch (err) {
        console.warn('Fallback to local event config', err);
      }
    }
    loadEvent();
    return () => { isMounted = false; };
  }, [isOpen, slug]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  const minMembers = eventConfig?.team_min || contextMin || (isTeam ? 2 : 1);
  const maxMembers = eventConfig?.team_max || contextMax || (isTeam ? 4 : 1);
  const maxAdditional = maxMembers - 1;

  // ── Form Handlers ─────────────────────────────────────────────────────────

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (name === 'teamName' && isTeam) {
      checkTeamNameAvailable(value);
    }
  };

  const checkTeamNameAvailable = async (name) => {
    if (!name || name.trim().length < 2) {
      setTeamNameAvailable(null);
      return;
    }
    setCheckingTeamName(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-team-name', {
        body: { event_slug: slug, team_name: name },
      });
      if (!error && data) {
        setTeamNameAvailable(data.available);
      }
    } catch (err) {
      console.warn('Team name check error:', err);
    } finally {
      setCheckingTeamName(false);
    }
  };

  const addMember = () => {
    if (members.length < maxAdditional) {
      setMembers((m) => [...m, { ...EMPTY_MEMBER }]);
    }
  };

  const removeMember = (i) => {
    setMembers((m) => m.filter((_, idx) => idx !== i));
  };

  const setMemberField = (i, field, value) => {
    setMembers((m) => m.map((mb, idx) => (idx === i ? { ...mb, [field]: value } : mb)));
  };

  // ── Client Validation ─────────────────────────────────────────────────────

  const validateForm = () => {
    setErrorMsg('');

    if (!form.name.trim()) return 'Full Name is required';
    if (!isValidEmail(form.email)) return 'Please enter a valid email address';
    if (!isValidPhone(form.phone)) return 'Please enter a valid 10-digit mobile phone number';

    // Semester & USN check
    const sem = Number(form.year ? form.year.charAt(0) * 2 - 1 : form.semester || 3);
    if ([3, 5, 7].includes(sem)) {
      if (!form.usn || !isValidUSN(form.usn)) {
        return `USN format is invalid for Semester ${sem}. Example: 1DB23CS001 (Must be 1DB + 23/24/25 + Branch + 3 digits)`;
      }
    }

    if (isInterCollege && !form.college.trim()) {
      return 'College Name is required for inter-college events';
    }

    if (isTeam) {
      if (!form.teamName.trim()) return 'Team Name is required';
      if (teamNameAvailable === false) return `Team name "${form.teamName}" is already taken for this event`;

      const totalCount = 1 + members.length;
      if (totalCount < minMembers) {
        return `Minimum ${minMembers} team members required for this event (Lead + ${minMembers - 1} members)`;
      }
      if (totalCount > maxMembers) {
        return `Maximum ${maxMembers} team members allowed for this event`;
      }

      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m.name.trim()) return `Member ${i + 2} Name is required`;
        if (!isValidUSN(m.usn)) return `Member ${i + 2} (${m.name}) USN format is invalid`;
      }
    }

    return null;
  };

  // ── Submit Registration ───────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valErr = validateForm();
    if (valErr) {
      setErrorMsg(valErr);
      return;
    }

    setStep('submitting');
    setErrorMsg('');

    try {
      const sem = Number(form.year ? form.year.charAt(0) * 2 - 1 : form.semester || 3);

      const allMembers = isTeam
        ? [
            {
              name: form.name.trim(),
              usn: form.usn.trim().toUpperCase(),
              email: form.email.trim(),
              phone: form.phone.trim(),
            },
            ...members.map((m) => ({
              name: m.name.trim(),
              usn: m.usn.trim().toUpperCase(),
              email: m.email?.trim() || null,
              phone: m.phone?.trim() || null,
            })),
          ]
        : [];

      const payload = {
        event_slug: slug,
        registrant: {
          name: form.name.trim(),
          usn: form.usn ? form.usn.trim().toUpperCase() : null,
          email: form.email.trim(),
          phone: form.phone.trim(),
          semester: sem,
          dept: form.dept,
          college: form.college || 'DBIT',
        },
        team_name: isTeam ? form.teamName.trim() : null,
        team_members: allMembers,
      };

      const { data, error } = await supabase.functions.invoke('create-registration', {
        body: payload,
      });

      if (error || !data) {
        const msg = error?.message || data?.error || 'Registration failed. Please try again.';
        setErrorMsg(msg);
        setStep('form');
        return;
      }

      if (data.error) {
        setErrorMsg(data.error);
        setStep('form');
        return;
      }

      // If free workshop: Instant success (no gateway)
      if (data.is_free) {
        setStep('success');
        return;
      }

      // If paid team event: Move to gateway payment checkout step
      setPaymentData(data);
      setStep('payment_checkout');
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg(err.message || 'An error occurred during submission.');
      setStep('form');
    }
  };

  // ── Gateway Verification Simulation ──────────────────────────────

  const handleSimulatePayment = async () => {
    setStep('verifying_payment');
    setErrorMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          payment_reference: paymentData.payment_reference,
          gateway_order_id: paymentData.gateway_order_id,
          gateway_payment_id: `PAY_MOCK_${Date.now()}`,
          gateway_signature: 'mock_valid_signature',
          amount_paid: paymentData.amount_expected,
          simulate_success: true,
        },
      });

      if (error || !data || data.error) {
        setErrorMsg(error?.message || data?.error || 'Payment verification failed.');
        setStep('payment_checkout');
        return;
      }

      setStep('success');
    } catch (err) {
      console.error('Payment verify error:', err);
      setErrorMsg(err.message || 'Payment verification failed.');
      setStep('payment_checkout');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeModal();
  };

  // ── Render Views ──────────────────────────────────────────────────────────

  return (
    <div
      className="modal-overlay active"
      id="registrationModal"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="modal-card">
        <button className="modal-close" onClick={closeModal} aria-label="Close">
          &times;
        </button>

        {/* ── Success View ── */}
        {step === 'success' ? (
          <div className="modal-success">
            <div className="success-checkmark">✓</div>
            <h3>Registration Confirmed!</h3>
            <p>
              {isWorkshop
                ? 'Your workshop seat has been reserved. No fee required.'
                : 'Your team registration and payment have been verified successfully!'}
            </p>
            <button className="btn-register" onClick={closeModal}>
              Done
            </button>
          </div>
        ) : step === 'payment_checkout' || step === 'verifying_payment' ? (
          /* ── Payment Gateway Checkout Step ── */
          <div>
            <div className="modal-header">
              <h3>Complete Payment</h3>
              <p className="modal-event-name">{eventTitle}</p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Order ID:</span>
                <strong>{paymentData?.gateway_order_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Team Name:</span>
                <strong>{form.teamName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total Members:</span>
                <strong>{1 + members.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--bg-card-border)' }}>
                <span>Amount Payable:</span>
                <strong style={{ color: 'var(--cyan)' }}>₹{paymentData?.amount_expected}</strong>
              </div>
            </div>

            {errorMsg && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>{errorMsg}</div>}

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Payment gateway integration abstraction (Razorpay / PayU / Cashfree). Click below to complete checkout.
            </p>

            <button
              type="button"
              className="btn-register"
              onClick={handleSimulatePayment}
              disabled={step === 'verifying_payment'}
              style={{ width: '100%' }}
            >
              {step === 'verifying_payment' ? 'Verifying Payment...' : `Pay ₹${paymentData?.amount_expected} & Confirm`}
            </button>
          </div>
        ) : (
          /* ── Registration Form View ── */
          <div id="modalFormView">
            <div className="modal-header">
              <h3>Register</h3>
              <p className="modal-event-name">{eventTitle}</p>

              {isWorkshop ? (
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                  ✓ Free Event (No Payment Required)
                </span>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                  ₹{eventConfig?.fee_per_head || 50}/head · Team ({minMembers}–{maxMembers} members)
                </span>
              )}
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form className="modal-form" onSubmit={handleSubmit}>

              {/* ── Team Name (Team events) ── */}
              {isTeam && (
                <div className="form-group">
                  <label htmlFor="reg-teamName">Team Name *</label>
                  <input
                    id="reg-teamName"
                    name="teamName"
                    type="text"
                    placeholder="Enter unique team name"
                    required
                    value={form.teamName}
                    onChange={setField}
                  />
                  {checkingTeamName && <span className="form-hint">Checking availability...</span>}
                  {teamNameAvailable === true && <span className="form-hint" style={{ color: '#10b981' }}>✓ Team name available</span>}
                  {teamNameAvailable === false && <span className="form-hint" style={{ color: '#ef4444' }}>✕ Team name already taken</span>}
                </div>
              )}

              {/* ── Registrant / Team Lead ── */}
              <div className="team-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                {isTeam ? 'Team Lead Details' : 'Participant Details'}
              </div>

              <div className="form-group">
                <label htmlFor="reg-name">Full Name *</label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  required
                  value={form.name}
                  onChange={setField}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-usn">USN *</label>
                  <input
                    id="reg-usn"
                    name="usn"
                    type="text"
                    placeholder="e.g. 1DB23CS001"
                    required
                    value={form.usn}
                    onChange={setField}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-year">Year *</label>
                  <select
                    id="reg-year"
                    name="year"
                    required
                    value={form.year}
                    onChange={setField}
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-email">Email *</label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={form.email}
                    onChange={setField}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reg-phone">Phone *</label>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    placeholder="10-digit mobile"
                    required
                    value={form.phone}
                    onChange={setField}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-dept">Department *</label>
                <select
                  id="reg-dept"
                  name="dept"
                  required
                  value={form.dept}
                  onChange={setField}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Inter-College field */}
              {isInterCollege && (
                <div className="form-group">
                  <label htmlFor="reg-college">College Name *</label>
                  <input
                    id="reg-college"
                    name="college"
                    type="text"
                    placeholder="Your college name"
                    required
                    value={form.college}
                    onChange={setField}
                  />
                </div>
              )}

              {/* ── Additional Team Members ── */}
              {isTeam && (
                <div className="team-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="team-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                      Additional Members ({members.length} added · {minMembers - 1} min required)
                    </div>
                    <button
                      type="button"
                      className="btn-add-member"
                      onClick={addMember}
                      disabled={members.length >= maxAdditional}
                      style={{ width: 'auto', margin: 0, padding: '4px 12px' }}
                    >
                      + Add Member
                    </button>
                  </div>

                  {members.map((m, i) => (
                    <div key={i} className="team-member-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                        <span>Member {i + 2}</span>
                        {i >= (minMembers - 1) && (
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => removeMember(i)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="Full Name *"
                            required
                            value={m.name}
                            onChange={(e) => setMemberField(i, 'name', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="USN *"
                            required
                            value={m.usn}
                            onChange={(e) => setMemberField(i, 'usn', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <input
                            type="email"
                            placeholder="Email (Optional)"
                            value={m.email}
                            onChange={(e) => setMemberField(i, 'email', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="tel"
                            placeholder="Phone (Optional)"
                            value={m.phone}
                            onChange={(e) => setMemberField(i, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="btn-register"
                disabled={step === 'submitting'}
                style={{ width: '100%', marginTop: '16px' }}
              >
                {step === 'submitting' ? 'Processing...' : isWorkshop ? 'Confirm Free Workshop Seat' : 'Proceed to Payment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
