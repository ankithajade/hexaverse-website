import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { registrationEvents } from '../data/registrationEvents';
import { isValidUSN, isValidEmail, isValidPhone, findDuplicateUSN } from '../lib/validators';
import {
  getEventConfig,
  checkTeamNameAvailability,
  submitRegistration,
  verifyPayment,
} from '../lib/registrationService';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import BackButton from '../components/BackButton';
import ScrollReveal from '../components/ScrollReveal';

const DEPARTMENTS = ['AI & ML', 'AI & DS', 'CSE', 'ISE', 'ECE', 'EEE'];
const SEMESTERS = ['1', '3', '5', '7'];

const EMPTY_FORM = {
  name: '',
  usn: '',
  email: '',
  dept: '',
  semester: '',
  phone: '',
  college: '',
  teamName: '',
};

const EMPTY_MEMBER = { name: '', usn: '', email: '', dept: '', phone: '' };

export default function RegisterPage() {
  const { eventId } = useParams();
  const event = registrationEvents[eventId];

  if (!event) return <Navigate to="/" replace />;

  const slug = eventId;
  const isWorkshop = slug.endsWith('-workshop');
  const isTeam = event.isTeam;
  const isInterCollege = event.isInterCollege;
  const lockedDept = event.lockedDepartment;

  // Supabase event config state
  const [eventConfig, setEventConfig] = useState(null);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    dept: lockedDept ? lockedDept.name : '',
  }));
  const [members, setMembers] = useState([]);
  const [teamNameAvailable, setTeamNameAvailable] = useState(null);
  const [checkingTeamName, setCheckingTeamName] = useState(false);

  // Flow steps: 'form' | 'submitting' | 'payment_checkout' | 'verifying_payment' | 'success'
  const [step, setStep] = useState('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    document.title = `Register for ${event.eventTitle} | DBIT HexaVerse CloudFest '26`;
    window.scrollTo(0, 0);

    setForm({
      ...EMPTY_FORM,
      dept: lockedDept ? lockedDept.name : '',
    });
    setMembers([]);
    setStep('form');
    setErrorMsg('');
    setTeamNameAvailable(null);
    setPaymentData(null);

    let isMounted = true;
    async function loadEvent() {
      try {
        const data = await getEventConfig(slug);
        if (isMounted && data) {
          setEventConfig(data);
          if (data.is_team && data.team_min) {
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
  }, [eventId, slug, lockedDept, event.eventTitle]);

  const minMembers = eventConfig?.team_min || event.teamMin || (isTeam ? 2 : 1);
  const maxMembers = eventConfig?.team_max || event.teamMax || (isTeam ? 4 : 1);
  const maxAdditional = maxMembers - 1;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (name === 'teamName' && isTeam) {
      checkTeamName(value);
    }
  };

  const checkTeamName = async (name) => {
    if (!name || name.trim().length < 2) {
      setTeamNameAvailable(null);
      return;
    }
    setCheckingTeamName(true);
    try {
      const avail = await checkTeamNameAvailability(slug, name);
      setTeamNameAvailable(avail);
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

  // ── Client Validation ───────────────────────────────────────────────────

  const validateForm = () => {
    setErrorMsg('');

    if (!form.name.trim()) return 'Full Name is required';
    if (!isValidEmail(form.email)) return 'Please enter a valid email address';
    if (!isValidPhone(form.phone)) return 'Please enter a valid 10-digit mobile phone number';
    if (!form.semester) return 'Please select your current semester';

    const sem = Number(form.semester);
    if ([3, 5, 7].includes(sem)) {
      if (!form.usn || !isValidUSN(form.usn)) {
        return `USN format is invalid for Semester ${sem}. Example: 1DB23CS001 (Must be 1DB + 23/24/25 + Branch + 3 digits)`;
      }
    }

    if (!lockedDept && !form.dept) {
      return 'Please select your department';
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

      const allUsns = [form.usn, ...members.map((m) => m.usn)].filter(Boolean);
      const duplicateUsn = findDuplicateUSN(allUsns);
      if (duplicateUsn) {
        return `Duplicate USN found in team: ${duplicateUsn}. Each team member must have a unique USN.`;
      }
    }

    return null;
  };

  // ── Form Submission ─────────────────────────────────────────────────────

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
      const sem = Number(form.semester);
      const finalDept = lockedDept ? lockedDept.name : form.dept;

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
          dept: finalDept,
          college: form.college || 'DBIT',
        },
        team_name: isTeam ? form.teamName.trim() : null,
        team_members: allMembers,
      };

      const res = await submitRegistration(payload);

      if (res.is_free) {
        setStep('success');
        return;
      }

      setPaymentData(res);
      setStep('payment_checkout');

      // Seamlessly trigger Cashfree Hosted Checkout if SDK is ready
      if (res.payment_session_id && typeof window.Cashfree === 'function') {
        try {
          const cashfree = window.Cashfree({ mode: 'sandbox' });
          cashfree.checkout({
            paymentSessionId: res.payment_session_id,
            redirectTarget: '_self',
          });
        } catch (cfErr) {
          console.warn('Auto checkout trigger deferred:', cfErr);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg(err.message || 'An error occurred during submission.');
      setStep('form');
    }
  };

  // ── Cashfree Payment Launcher ───────────────────────────────────────────

  const handleLaunchPayment = () => {
    if (!paymentData?.payment_session_id) {
      setErrorMsg('Payment session ID is missing. Please try submitting again.');
      return;
    }

    if (typeof window.Cashfree !== 'function') {
      setErrorMsg('Payment gateway SDK is loading. Please click Pay again in a moment.');
      return;
    }

    try {
      const cashfree = window.Cashfree({ mode: 'sandbox' });
      cashfree.checkout({
        paymentSessionId: paymentData.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err) {
      console.error('Payment checkout error:', err);
      setErrorMsg(err.message || 'Failed to open Cashfree payment checkout.');
    }
  };

  return (
    <div>
      <Nav />

      {/* Back Button & Breadcrumb */}
      <div className="container" style={{ paddingTop: '90px' }}>
        <BackButton style={{ marginBottom: '12px' }} />
        <ScrollReveal className="dept-breadcrumb" style={{ padding: 0 }}>
          <Link to="/">Home</Link> <span>/</span>{' '}
          {lockedDept ? (
            <>
              <Link to={`/departments/${lockedDept.id}`}>{lockedDept.name}</Link> <span>/</span>
            </>
          ) : (
            <>
              <Link to="/#events">Events</Link> <span>/</span>
            </>
          )}
          <span>Register: {event.eventTitle}</span>
        </ScrollReveal>
      </div>

      <main className="container" style={{ maxWidth: '820px', marginBottom: '80px' }}>

        {/* ── Success View (Free Workshops only from this form) ── */}
        {step === 'success' ? (
          <ScrollReveal className="mega-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '16px' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Registration Confirmed!</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', marginBottom: '28px' }}>
              Your workshop seat has been reserved successfully. No registration fee required.
            </p>
            <Link to="/" className="btn-register" style={{ padding: '12px 32px' }}>
              Back to Home
            </Link>
          </ScrollReveal>
        ) : step === 'payment_checkout' ? (
          /* ── Cashfree Payment Checkout Step ── */
          <ScrollReveal className="mega-card" style={{ padding: '36px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div className="section-label">Checkout</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text)' }}>
                Complete Payment
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>{event.eventTitle}</p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '20px 24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Order ID:</span>
                <strong>{paymentData?.gateway_order_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Team Name:</span>
                <strong>{form.teamName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total Members:</span>
                <strong>{1 + members.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--bg-card-border)' }}>
                <span>Amount Payable:</span>
                <strong style={{ color: 'var(--cyan)' }}>₹{paymentData?.amount_expected}</strong>
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#dc2626', padding: '12px 16px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px' }}>
                {errorMsg}
              </div>
            )}

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              🔒 Powered by Cashfree Payments (UPI Only). You will be redirected to complete your payment securely.
            </p>

            <button
              type="button"
              className="btn-register"
              onClick={handleLaunchPayment}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', cursor: 'pointer' }}
            >
              Pay ₹{paymentData?.amount_expected} via UPI
            </button>
          </ScrollReveal>
        ) : (
          /* ── Registration Form & Rules View ── */
          <div>
            {/* ── Rules & Registration Details Block (Item D3 / D4) ── */}
            <ScrollReveal
              className="mega-card"
              style={{
                marginBottom: '32px',
                borderLeft: '4px solid var(--cyan)',
                background: 'var(--bg-card)',
                padding: '28px 32px',
              }}
            >
              <div className="section-label" style={{ marginBottom: '8px' }}>Event Rules &amp; Details</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--text)', marginBottom: '8px' }}>
                {event.eventTitle}
              </h1>
              {lockedDept && (
                <div style={{ fontSize: '0.9rem', color: 'var(--cyan)', fontWeight: 600, marginBottom: '12px' }}>
                  Hosted by {lockedDept.name} Department
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                {event.dates && <div>📅 {event.dates}</div>}
                <div>
                  {isWorkshop ? (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Free Registration</span>
                  ) : (
                    <span>💰 ₹{event.fee || 50}/head · Team ({minMembers}–{maxMembers} members)</span>
                  )}
                </div>
                {isInterCollege && <div style={{ color: 'var(--orange)', fontWeight: 600 }}>🌐 Inter-College Event</div>}
              </div>

              <h4 style={{ fontFamily: 'var(--font-subheading)', fontSize: '0.95rem', color: 'var(--text)', marginBottom: '10px' }}>
                Guidelines &amp; Regulations:
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                {event.registrationRules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{rule}</li>
                ))}
              </ul>
            </ScrollReveal>

            {/* ── Registration Form ── */}
            <ScrollReveal className="mega-card" style={{ padding: '36px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)' }}>
                  Registration Form
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Please fill in accurate participant details below.
                </p>
              </div>

              {errorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#dc2626', padding: '12px 16px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {errorMsg}
                </div>
              )}

              <form className="modal-form" onSubmit={handleSubmit}>

                {/* Team Name (if team event) */}
                {isTeam && (
                  <div className="form-group">
                    <label htmlFor="reg-teamName">Team Name *</label>
                    <input
                      id="reg-teamName"
                      name="teamName"
                      type="text"
                      className="form-input"
                      placeholder="Enter unique team name"
                      required
                      value={form.teamName}
                      onChange={setField}
                    />
                    {checkingTeamName && <span className="form-hint">Checking team name availability...</span>}
                    {teamNameAvailable === true && <span className="form-hint" style={{ color: '#10b981' }}>✓ Team name available</span>}
                    {teamNameAvailable === false && <span className="form-hint" style={{ color: '#ef4444' }}>✕ Team name already taken</span>}
                  </div>
                )}

                {/* Participant / Lead Details Header */}
                <div className="team-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', fontWeight: 700 }}>
                  {isTeam ? 'Team Lead Details' : 'Participant Details'}
                </div>

                <div className="form-group">
                  <label htmlFor="reg-name">Full Name *</label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    className="form-input"
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
                      className="form-input"
                      placeholder="e.g. 1DB23CS001"
                      required
                      value={form.usn}
                      onChange={setField}
                    />
                  </div>

                  {/* Item D2: Semester Select (1, 3, 5, 7) */}
                  <div className="form-group">
                    <label htmlFor="reg-semester">Semester *</label>
                    <select
                      id="reg-semester"
                      name="semester"
                      className="form-select"
                      required
                      value={form.semester}
                      onChange={setField}
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
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
                      className="form-input"
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
                      className="form-input"
                      placeholder="10-digit mobile"
                      required
                      value={form.phone}
                      onChange={setField}
                    />
                  </div>
                </div>

                {/* Item D1: Locked Department display vs Free Choice dropdown */}
                <div className="form-group">
                  <label htmlFor="reg-dept">Department *</label>
                  {lockedDept ? (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg)',
                        border: '1.5px solid var(--bg-card-border)',
                        borderRadius: '8px',
                        fontWeight: 600,
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                      }}
                    >
                      {lockedDept.name} (Locked for this department event)
                    </div>
                  ) : (
                    <select
                      id="reg-dept"
                      name="dept"
                      className="form-select"
                      required
                      value={form.dept}
                      onChange={setField}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Inter-College field */}
                {isInterCollege && (
                  <div className="form-group">
                    <label htmlFor="reg-college">College Name *</label>
                    <input
                      id="reg-college"
                      name="college"
                      type="text"
                      className="form-input"
                      placeholder="Your college name"
                      required
                      value={form.college}
                      onChange={setField}
                    />
                  </div>
                )}

                {/* Additional Team Members */}
                {isTeam && (
                  <div className="team-section" style={{ marginTop: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="team-section-title" style={{ margin: 0, padding: 0, border: 'none', fontWeight: 700 }}>
                        Additional Members ({members.length} added · {minMembers - 1} min required)
                      </div>
                      <button
                        type="button"
                        className="btn-add-member"
                        onClick={addMember}
                        disabled={members.length >= maxAdditional}
                        style={{ width: 'auto', margin: 0, padding: '6px 14px' }}
                      >
                        + Add Member
                      </button>
                    </div>

                    {members.map((m, i) => (
                      <div key={i} className="team-member-row" style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                          <span>Member {i + 2}</span>
                          {i >= (minMembers - 1) && (
                            <button
                              type="button"
                              className="btn-remove-member"
                              onClick={() => removeMember(i)}
                              style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Full Name *"
                              required
                              value={m.name}
                              onChange={(e) => setMemberField(i, 'name', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <input
                              type="text"
                              className="form-input"
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
                              className="form-input"
                              placeholder="Email (Optional)"
                              value={m.email}
                              onChange={(e) => setMemberField(i, 'email', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <input
                              type="tel"
                              className="form-input"
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
                  style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '1.05rem' }}
                >
                  {step === 'submitting' ? 'Processing...' : isWorkshop ? 'Confirm Free Workshop Seat' : 'Proceed to Payment'}
                </button>
              </form>
            </ScrollReveal>
          </div>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
