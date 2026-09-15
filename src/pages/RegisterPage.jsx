import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { registrationEvents } from '../data/registrationEvents';
import {
  isValidUSN,
  isValidEmail,
  isValidPhone,
  findDuplicateUSN,
  isUSNEligibleForDept,
} from '../lib/validators';
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
import RichText from '../components/RichText';
import { FiCheck, FiCheckCircle, FiX, FiLock, FiAlertTriangle } from 'react-icons/fi';

const DEPARTMENTS = [
  'Artificial Intelligence & Machine Learning',
  'Artificial Intelligence & Data Science',
  'Computer Science and Engineering',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
];
const SEMESTERS = ['1', '3', '5', '7'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const CYCLES = ['Physics Cycle', 'Chemistry Cycle'];
const SEM1_DEPARTMENTS = [
  { id: 'aiml', label: 'Artificial Intelligence & Machine Learning' },
  { id: 'aids', label: 'Artificial Intelligence & Data Science' },
  { id: 'cse', label: 'Computer Science and Engineering' },
  { id: 'ise', label: 'Information Science and Engineering' },
  { id: 'ece', label: 'Electronics and Communication Engineering' },
  { id: 'eee', label: 'Electrical and Electronics Engineering' },
  { id: 'iot_cyber', label: 'IoT and Cybersecurity including Blockchain' },
];

const DEPT_FULL_NAMES = {
  aiml: 'Artificial Intelligence & Machine Learning',
  aids: 'Artificial Intelligence & Data Science',
  cse: 'Computer Science and Engineering',
  ise: 'Information Science and Engineering',
  ece: 'Electronics and Communication Engineering',
  eee: 'Electrical and Electronics Engineering',
  iot_cyber: 'IoT and Cybersecurity including Blockchain',
};

const EMPTY_FORM = {
  name: '',
  usn: '',
  section: '',
  email: '',
  dept: '',
  semester: '',
  phone: '',
  teamName: '',
  cycle: '',
  selectedDept: '',
  rollNumber: '',
};

const EMPTY_MEMBER = { name: '', usn: '', email: '', dept: '', phone: '' };

export default function RegisterPage() {
  const { eventId } = useParams();
  const event = registrationEvents[eventId];

  if (!event) return <Navigate to="/" replace />;

  const slug = eventId;
  const isWorkshop = slug.endsWith('-workshop');
  const isTeam = event.isTeam;
  const lockedDept = event.lockedDepartment;
  const lockedDeptFullName = lockedDept ? (DEPT_FULL_NAMES[lockedDept.id] || lockedDept.name) : '';

  // Supabase event config state
  const [eventConfig, setEventConfig] = useState(null);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    dept: lockedDeptFullName || '',
  }));
  const [members, setMembers] = useState([]);
  const [teamNameAvailable, setTeamNameAvailable] = useState(null);
  const [checkingTeamName, setCheckingTeamName] = useState(false);

  // Validation & feedback state
  const [touched, setTouched] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Flow steps: 'form' | 'submitting' | 'payment_checkout' | 'verifying_payment' | 'success'
  const [step, setStep] = useState('form');
  const [serverError, setServerError] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    document.title = `Register for ${event.eventTitle} | DBIT HexaVerse CloudFest '26`;
    window.scrollTo(0, 0);

    setForm({
      ...EMPTY_FORM,
      dept: lockedDeptFullName || '',
    });
    setMembers([]);
    setStep('form');
    setServerError('');
    setTouched({});
    setHasSubmitted(false);
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
  }, [eventId, slug, lockedDeptFullName, event.eventTitle]);

  const minMembers = eventConfig?.team_min || event.teamMin || (isTeam ? 2 : 1);
  const maxMembers = eventConfig?.team_max || event.teamMax || (isTeam ? 4 : 1);
  const maxAdditional = maxMembers - 1;

  // Derived: semester checks for locked-dept path
  const sem = Number(form.semester);
  const isHighSem = Boolean(lockedDept && [3, 5, 7].includes(sem));
  const isSem1 = Boolean(lockedDept && sem === 1);
  const semester1GateComplete = Boolean(form.cycle && form.section && form.selectedDept);
  const isEligibleSem1Dept = Boolean(
    form.selectedDept &&
    lockedDept &&
    (form.selectedDept === lockedDept.id || (lockedDept.id === 'ece' && form.selectedDept === 'iot_cyber'))
  );
  const isEligibleSem1 = Boolean(
    isSem1 &&
    semester1GateComplete &&
    isEligibleSem1Dept
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (serverError) setServerError('');

    if (name === 'teamName' && isTeam) {
      checkTeamName(value);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
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
    setTouched((prev) => {
      const next = { ...prev };
      delete next[`member_${i}_name`];
      delete next[`member_${i}_usn`];
      delete next[`member_${i}_email`];
      delete next[`member_${i}_phone`];
      delete next[`member_${i}_dept`];
      return next;
    });
  };

  const setMemberField = (i, field, value) => {
    setMembers((m) => m.map((mb, idx) => (idx === i ? { ...mb, [field]: value } : mb)));
    setTouched((prev) => ({ ...prev, [`member_${i}_${field}`]: true }));
    if (serverError) setServerError('');
  };

  const handleMemberBlur = (i, field) => {
    setTouched((prev) => ({ ...prev, [`member_${i}_${field}`]: true }));
  };

  // ── Client Validation (All errors at once) ────────────────────────────────

  const validateForm = (formData = form, memberList = members) => {
    const errors = {};

    if (isTeam) {
      if (!formData.teamName?.trim()) {
        errors.teamName = 'Team Name is required';
      } else if (teamNameAvailable === false) {
        errors.teamName = `Team name "${formData.teamName}" is already taken for this event`;
      }
    }

    if (!formData.name?.trim()) {
      errors.name = 'Full Name is required';
    }

    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.semester) {
      errors.semester = 'Please select your current semester';
    }

    const currentSem = Number(formData.semester);

    if (lockedDept) {
      if (currentSem === 1) {
        if (!formData.section) {
          errors.section = 'Please select your section';
        }
        if (!formData.rollNumber?.trim()) {
          errors.rollNumber = 'Roll Number is required';
        }
        if (!formData.cycle) {
          errors.cycle = 'Please select your cycle';
        }
        if (!formData.selectedDept) {
          errors.selectedDept = 'Please select your department';
        } else {
          const isEligible = formData.selectedDept === lockedDept.id || (lockedDept.id === 'ece' && formData.selectedDept === 'iot_cyber');
          if (!isEligible) {
            errors.selectedDept = 'You are not eligible for this event';
          }
        }
      } else if ([3, 5, 7].includes(currentSem)) {
        if (!formData.section) {
          errors.section = 'Please select your section';
        }
        if (!formData.usn?.trim()) {
          errors.usn = 'USN is required';
        } else if (!isValidUSN(formData.usn)) {
          errors.usn = `Invalid USN format (e.g. 1DB23${lockedDept.id === 'aiml' ? 'CI' : 'CS'}001)`;
        } else if (!isUSNEligibleForDept(formData.usn, lockedDept.id)) {
          errors.usn = 'You are not eligible for this event';
        }
      }
    } else {
      // Mega event path
      if ([3, 5, 7].includes(currentSem)) {
        if (!formData.usn?.trim()) {
          errors.usn = 'USN is required';
        } else if (!isValidUSN(formData.usn)) {
          errors.usn = 'Invalid USN format (e.g. 1DB23CS001)';
        }
      }
      if (!formData.dept) {
        errors.dept = 'Please select your department';
      }
    }


    if (isTeam) {
      const totalCount = 1 + memberList.length;
      if (totalCount < minMembers) {
        errors.teamMembers = `Minimum ${minMembers} team members required (Lead + ${minMembers - 1} members)`;
      } else if (totalCount > maxMembers) {
        errors.teamMembers = `Maximum ${maxMembers} team members allowed`;
      }

      const allUsns = [];
      if (formData.usn?.trim()) {
        allUsns.push({ key: 'usn', usn: formData.usn.trim().toUpperCase() });
      }

      memberList.forEach((m, i) => {
        if (!m.name?.trim()) {
          errors[`member_${i}_name`] = `Member ${i + 2} Name is required`;
        }

        if (!m.usn?.trim()) {
          errors[`member_${i}_usn`] = `Member ${i + 2} USN is required`;
        } else if (!isValidUSN(m.usn)) {
          errors[`member_${i}_usn`] = `Member ${i + 2} USN format is invalid`;
        } else if (lockedDept && [3, 5, 7].includes(currentSem) && !isUSNEligibleForDept(m.usn, lockedDept.id)) {
          errors[`member_${i}_usn`] = `Member ${i + 2} is not eligible for this event`;
        } else {
          allUsns.push({ key: `member_${i}_usn`, usn: m.usn.trim().toUpperCase() });
        }

        if (!m.phone?.trim()) {
          errors[`member_${i}_phone`] = `Member ${i + 2} phone is required`;
        } else if (!isValidPhone(m.phone)) {
          errors[`member_${i}_phone`] = 'Enter a valid 10-digit mobile number';
        }

        if (m.email?.trim() && !isValidEmail(m.email)) {
          errors[`member_${i}_email`] = 'Please enter a valid email address';
        }
      });

      // Check duplicate USNs across team
      const seen = new Map();
      for (const item of allUsns) {
        if (seen.has(item.usn)) {
          const prevKey = seen.get(item.usn);
          errors[item.key] = `Duplicate USN: ${item.usn} is already used in team`;
          if (!errors[prevKey]) {
            errors[prevKey] = `Duplicate USN: ${item.usn} is already used in team`;
          }
        } else {
          seen.set(item.usn, item.key);
        }
      }
    }

    return errors;
  };

  const formErrors = validateForm(form, members);

  // ── Per-field Reactive Feedback & Error Helper ─────────────────────────────

  const getFieldFeedback = (key) => {
    const isFieldTouched = touched[key] || hasSubmitted;
    const error = formErrors[key];

    // Reactive format feedback as user types
    if (key === 'phone') {
      if (form.phone && !isValidPhone(form.phone)) {
        return { hasError: true, error: 'Enter a valid 10-digit mobile number' };
      }
      if (isFieldTouched && error) {
        return { hasError: true, error };
      }
      return null;
    }

    if (key === 'email') {
      if (form.email && !isValidEmail(form.email)) {
        return { hasError: true, error: 'Please enter a valid email address' };
      }
      if (isFieldTouched && error) {
        return { hasError: true, error };
      }
      return null;
    }

    if (key === 'usn') {
      if (form.usn) {
        if (!isValidUSN(form.usn)) {
          return { hasError: true, error: `Invalid USN format (e.g. 1DB23${lockedDept?.id === 'aiml' ? 'CI' : 'CS'}001)` };
        }
        if (lockedDept && isHighSem && !isUSNEligibleForDept(form.usn, lockedDept.id)) {
          return { hasError: true, error: 'You are not eligible for this event' };
        }
        if (error && error.includes('Duplicate')) {
          return { hasError: true, error };
        }
        return { hasError: false, hint: 'USN valid', hintColor: '#10b981', showCheck: true };
      }
      if (isFieldTouched && error) {
        return { hasError: true, error };
      }
      return null;
    }

    if (key === 'teamName' && isTeam) {
      if (checkingTeamName) {
        return { hasError: false, hint: 'Checking team name availability...', hintColor: 'var(--text-dim)' };
      }
      if (teamNameAvailable === true) {
        return { hasError: false, hint: 'Team name available', hintColor: '#10b981', showCheck: true };
      }
      if (teamNameAvailable === false) {
        return { hasError: true, error: `Team name "${form.teamName}" is already taken` };
      }
      if (isFieldTouched && error) {
        return { hasError: true, error };
      }
      return null;
    }

    // Member fields
    if (key.startsWith('member_')) {
      const parts = key.split('_');
      const mIdx = Number(parts[1]);
      const mField = parts[2];
      const member = members[mIdx];

      if (member) {
        if (mField === 'phone') {
          if (member.phone && !isValidPhone(member.phone)) {
            return { hasError: true, error: 'Enter a valid 10-digit mobile number' };
          }
        }
        if (mField === 'email') {
          if (member.email && !isValidEmail(member.email)) {
            return { hasError: true, error: 'Please enter a valid email address' };
          }
        }
        if (mField === 'usn') {
          if (member.usn) {
            if (!isValidUSN(member.usn)) {
              return { hasError: true, error: 'Invalid USN format' };
            }
            if (lockedDept && isHighSem && !isUSNEligibleForDept(member.usn, lockedDept.id)) {
              return { hasError: true, error: 'Not eligible for this event' };
            }
            if (error && error.includes('Duplicate')) {
              return { hasError: true, error };
            }
            return { hasError: false, hint: 'Valid', hintColor: '#10b981', showCheck: true };
          }
        }
      }

      if (isFieldTouched && error) {
        return { hasError: true, error };
      }
      return null;
    }

    // General fields
    if (isFieldTouched && error) {
      return { hasError: true, error };
    }

    return null;
  };

  const renderFieldFeedback = (key) => {
    const fb = getFieldFeedback(key);
    if (!fb) return null;
    if (fb.hasError) {
      return (
        <div
          style={{
            color: '#ef4444',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FiX style={{ flexShrink: 0 }} />
          <span>{fb.error}</span>
        </div>
      );
    }
    if (fb.hint) {
      return (
        <div
          style={{
            color: fb.hintColor || '#10b981',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {fb.showCheck && <FiCheck style={{ flexShrink: 0 }} />}
          <span>{fb.hint}</span>
        </div>
      );
    }
    return null;
  };

  const getInputStyle = (key, customStyle = {}) => {
    const fb = getFieldFeedback(key);
    return {
      ...customStyle,
      ...(fb?.hasError ? { borderColor: '#ef4444' } : {}),
    };
  };

  // ── Form Submission ─────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setServerError('');

    const currentErrors = validateForm(form, members);
    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    setStep('submitting');

    try {
      const finalSem = Number(form.semester);
      const finalDept = lockedDept ? lockedDeptFullName : form.dept;

      const allMembers = isTeam
        ? [
            {
              name: form.name.trim(),
              usn: sem === 1 ? (form.rollNumber ? form.rollNumber.trim() : null) : (form.usn ? form.usn.trim().toUpperCase() : null),
              roll_number: sem === 1 ? form.rollNumber.trim() : null,
              email: form.email.trim(),
              phone: form.phone.trim(),
              dept: finalDept || null,
            },
            ...members.map((m) => ({
              name: m.name.trim(),
              usn: m.usn.trim().toUpperCase(),
              email: m.email?.trim() || null,
              phone: m.phone.trim(),
              dept: m.dept?.trim() || finalDept || null,
            })),
          ]
        : [];

      const payload = {
        event_slug: slug,
        registrant: {
          name: form.name.trim(),
          usn: sem === 1 ? null : (form.usn ? form.usn.trim().toUpperCase() : null),
          roll_number: sem === 1 ? form.rollNumber.trim() : null,
          cycle: sem === 1 ? form.cycle : null,
          selected_dept: sem === 1 ? form.selectedDept : null,
          email: form.email.trim(),
          phone: form.phone.trim(),
          semester: finalSem,
          dept: finalDept,
          section: form.section || null,
        },
        team_name: isTeam ? form.teamName.trim() : null,
        section: form.section || null,
        cycle: sem === 1 ? form.cycle : null,
        selected_dept: sem === 1 ? form.selectedDept : null,
        roll_number: sem === 1 ? form.rollNumber.trim() : null,
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
          const cashfree = window.Cashfree({ mode: 'production' });
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
      setServerError(err.message || 'An error occurred during submission.');
      setStep('form');
    }
  };

  // ── Cashfree Payment Launcher ───────────────────────────────────────────

  const handleLaunchPayment = () => {
    if (!paymentData?.payment_session_id) {
      setServerError('Payment session ID is missing. Please try submitting again.');
      return;
    }

    if (typeof window.Cashfree !== 'function') {
      setServerError('Payment gateway SDK is loading. Please click Pay again in a moment.');
      return;
    }

    try {
      const cashfree = window.Cashfree({ mode: 'production' });
      cashfree.checkout({
        paymentSessionId: paymentData.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err) {
      console.error('Payment checkout error:', err);
      setServerError(err.message || 'Failed to open Cashfree payment checkout.');
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
            <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><FiCheckCircle /></div>
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

            {serverError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#dc2626', padding: '12px 16px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px' }}>
                {serverError}
              </div>
            )}

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              <FiLock style={{ verticalAlign: 'middle', marginRight: '5px', position: 'relative', top: '-1px' }} /> Powered by Cashfree Payments (UPI Only). You will be redirected to complete your payment securely.
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
            {/* ── Rules & Registration Details Block ── */}
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
                  Hosted by {lockedDeptFullName}
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                {event.dates && <div>📅 {event.dates}</div>}
                <div>
                  {isWorkshop ? (
                    <span style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FiCheck />Free Registration</span>
                  ) : (
                    <span>💰 ₹{event.fee || 50}/head · Team ({minMembers}–{maxMembers} members)</span>
                  )}
                </div>

              </div>

              <h4 style={{ fontFamily: 'var(--font-subheading)', fontSize: '0.95rem', color: 'var(--text)', marginBottom: '10px' }}>
                Guidelines &amp; Regulations:
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                {event.registrationRules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <RichText>{rule}</RichText>
                  </li>
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

              {serverError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#dc2626', padding: '12px 16px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {serverError}
                </div>
              )}

              <form className="modal-form" onSubmit={handleSubmit} noValidate>

                {/* ══════════════════════════════════════════════════
                    LOCKED-DEPT PATH: Personal details first flow
                    ══════════════════════════════════════════════════ */}
                {lockedDept ? (
                  <>
                    {/* a. Team Name (if team event) */}
                    {isTeam && (
                      <div className="form-group">
                        <label htmlFor="reg-teamName">Team Name *</label>
                        {renderFieldFeedback('teamName')}
                        <input
                          id="reg-teamName"
                          name="teamName"
                          type="text"
                          className="form-input"
                          placeholder="Enter unique team name"
                          value={form.teamName}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('teamName')}
                        />
                      </div>
                    )}

                    {/* b. Participant / Lead Details Header */}
                    <div className="team-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', fontWeight: 700 }}>
                      {isTeam ? 'Team Lead Details' : 'Participant Details'}
                    </div>

                    {/* c. Full Name — its own row */}
                    <div className="form-group">
                      <label htmlFor="reg-name">Full Name *</label>
                      {renderFieldFeedback('name')}
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        className="form-input"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={setField}
                        onBlur={handleBlur}
                        style={getInputStyle('name')}
                      />
                    </div>

                    {/* d. Email + Phone — same row (form-row) */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-email">Email *</label>
                        {renderFieldFeedback('email')}
                        <input
                          id="reg-email"
                          name="email"
                          type="email"
                          className="form-input"
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('email')}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="reg-phone">Phone *</label>
                        {renderFieldFeedback('phone')}
                        <input
                          id="reg-phone"
                          name="phone"
                          type="tel"
                          className="form-input"
                          placeholder="10-digit mobile"
                          value={form.phone}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('phone')}
                        />
                      </div>
                    </div>

                    {/* e. One row containing: Semester select, Section select, and USN / Roll Number */}
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-semester">Semester *</label>
                        {renderFieldFeedback('semester')}
                        <select
                          id="reg-semester"
                          name="semester"
                          className="form-select"
                          value={form.semester}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('semester')}
                        >
                          <option value="">Select Semester</option>
                          {SEMESTERS.map((s) => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-section">Section *</label>
                        {renderFieldFeedback('section')}
                        <select
                          id="reg-section"
                          name="section"
                          className="form-select"
                          value={form.section}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('section')}
                        >
                          <option value="">Select Section</option>
                          {SECTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Roll Number input if semester is 1 */}
                      {sem === 1 && (
                        <div className="form-group">
                          <label htmlFor="reg-rollNumber">Roll Number *</label>
                          {renderFieldFeedback('rollNumber')}
                          <input
                            id="reg-rollNumber"
                            name="rollNumber"
                            type="text"
                            className="form-input"
                            placeholder="Enter your roll number"
                            value={form.rollNumber}
                            onChange={setField}
                            onBlur={handleBlur}
                            style={getInputStyle('rollNumber')}
                          />
                        </div>
                      )}

                      {/* USN input if semester is 3, 5, or 7 */}
                      {isHighSem && (
                        <div className="form-group">
                          <label htmlFor="reg-usn">USN *</label>
                          {renderFieldFeedback('usn')}
                          <input
                            id="reg-usn"
                            name="usn"
                            type="text"
                            className="form-input"
                            placeholder={`e.g. 1DB23${lockedDept.id === 'aiml' ? 'CI' : 'CS'}001`}
                            value={form.usn}
                            onChange={setField}
                            onBlur={handleBlur}
                            style={getInputStyle('usn')}
                          />
                        </div>
                      )}
                    </div>

                    {/* f. If semester === 1, an additional row directly below (e): Cycle select + Department select */}
                    {sem === 1 && (
                      <>
                        <div style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 600, marginBottom: '8px' }}>
                          Only {lockedDeptFullName} students can join this event.
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="reg-cycle">Cycle *</label>
                            {renderFieldFeedback('cycle')}
                            <select
                              id="reg-cycle"
                              name="cycle"
                              className="form-select"
                              value={form.cycle}
                              onChange={setField}
                              onBlur={handleBlur}
                              style={getInputStyle('cycle')}
                            >
                              <option value="">Select Cycle</option>
                              {CYCLES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label htmlFor="reg-selectedDept">Department *</label>
                            {renderFieldFeedback('selectedDept')}
                            <select
                              id="reg-selectedDept"
                              name="selectedDept"
                              className="form-select"
                              value={form.selectedDept}
                              onChange={setField}
                              onBlur={handleBlur}
                              style={getInputStyle('selectedDept')}
                            >
                              <option value="">Select Department</option>
                              {SEM1_DEPARTMENTS.map((d) => (
                                <option key={d.id} value={d.id}>{d.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* g. Inline eligibility feedback for Semester 1 */}
                        {form.selectedDept && !isEligibleSem1Dept && (
                          <div
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid #ef4444',
                              color: '#dc2626',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              marginBottom: '16px',
                              textAlign: 'center',
                            }}
                          >
                            You are not eligible for this event
                          </div>
                        )}
                      </>
                    )}

                    {/* h. Department display for sem 3/5/7 */}
                    {isHighSem && (
                      <div className="form-group">
                        <div style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 600, marginBottom: '8px' }}>
                          Only {lockedDeptFullName} students can join this event.
                        </div>
                        <label htmlFor="reg-dept">Department *</label>
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
                          {lockedDeptFullName}
                        </div>
                      </div>
                    )}



                    {/* i. Additional Team Members */}
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

                        {hasSubmitted && formErrors.teamMembers && (
                          <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                            <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '4px' }} />{formErrors.teamMembers}
                          </div>
                        )}

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
                                {renderFieldFeedback(`member_${i}_name`)}
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Full Name *"
                                  value={m.name}
                                  onChange={(e) => setMemberField(i, 'name', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'name')}
                                  style={getInputStyle(`member_${i}_name`)}
                                />
                              </div>
                              <div className="form-group">
                                {renderFieldFeedback(`member_${i}_usn`)}
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="USN *"
                                  value={m.usn}
                                  onChange={(e) => setMemberField(i, 'usn', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'usn')}
                                  style={getInputStyle(`member_${i}_usn`)}
                                />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                {renderFieldFeedback(`member_${i}_email`)}
                                <input
                                  type="email"
                                  className="form-input"
                                  placeholder="Email (Optional)"
                                  value={m.email}
                                  onChange={(e) => setMemberField(i, 'email', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'email')}
                                  style={getInputStyle(`member_${i}_email`)}
                                />
                              </div>
                              <div className="form-group">
                                {renderFieldFeedback(`member_${i}_phone`)}
                                <input
                                  type="tel"
                                  className="form-input"
                                  placeholder="Phone *"
                                  value={m.phone}
                                  onChange={(e) => setMemberField(i, 'phone', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'phone')}
                                  style={getInputStyle(`member_${i}_phone`)}
                                />
                              </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '4px' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                Department: <strong style={{ color: 'var(--text)' }}>{lockedDeptFullName}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* ══════════════════════════════════════════════════
                      MEGA EVENT PATH (lockedDept === null)
                      ══════════════════════════════════════════════════ */
                  <>
                    {/* Team Name (if team event) */}
                    {isTeam && (
                      <div className="form-group">
                        <label htmlFor="reg-teamName">Team Name *</label>
                        {renderFieldFeedback('teamName')}
                        <input
                          id="reg-teamName"
                          name="teamName"
                          type="text"
                          className="form-input"
                          placeholder="Enter unique team name"
                          value={form.teamName}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('teamName')}
                        />
                      </div>
                    )}

                    {/* Participant / Lead Details Header */}
                    <div className="team-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', fontWeight: 700 }}>
                      {isTeam ? 'Team Lead Details' : 'Participant Details'}
                    </div>

                    <div className="form-group">
                      <label htmlFor="reg-name">Full Name *</label>
                      {renderFieldFeedback('name')}
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        className="form-input"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={setField}
                        onBlur={handleBlur}
                        style={getInputStyle('name')}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reg-usn">USN *</label>
                        {renderFieldFeedback('usn')}
                        <input
                          id="reg-usn"
                          name="usn"
                          type="text"
                          className="form-input"
                          placeholder="e.g. 1DB23CS001"
                          value={form.usn}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('usn')}
                        />
                      </div>

                      {/* Semester Select (1, 3, 5, 7) */}
                      <div className="form-group">
                        <label htmlFor="reg-semester">Semester *</label>
                        {renderFieldFeedback('semester')}
                        <select
                          id="reg-semester"
                          name="semester"
                          className="form-select"
                          value={form.semester}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('semester')}
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
                        {renderFieldFeedback('email')}
                        <input
                          id="reg-email"
                          name="email"
                          type="email"
                          className="form-input"
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('email')}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-phone">Phone *</label>
                        {renderFieldFeedback('phone')}
                        <input
                          id="reg-phone"
                          name="phone"
                          type="tel"
                          className="form-input"
                          placeholder="10-digit mobile"
                          value={form.phone}
                          onChange={setField}
                          onBlur={handleBlur}
                          style={getInputStyle('phone')}
                        />
                      </div>
                    </div>

                    {/* Department: free-choice dropdown for mega events */}
                    <div className="form-group">
                      <label htmlFor="reg-dept">Department *</label>
                      {renderFieldFeedback('dept')}
                      <select
                        id="reg-dept"
                        name="dept"
                        className="form-select"
                        value={form.dept}
                        onChange={setField}
                        onBlur={handleBlur}
                        style={getInputStyle('dept')}
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>



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

                        {hasSubmitted && formErrors.teamMembers && (
                          <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                            <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '4px' }} />{formErrors.teamMembers}
                          </div>
                        )}

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
                                {renderFieldFeedback(`member_${i}_name`)}
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Full Name *"
                                  value={m.name}
                                  onChange={(e) => setMemberField(i, 'name', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'name')}
                                  style={getInputStyle(`member_${i}_name`)}
                                />
                              </div>
                              <div className="form-group">
                                {renderFieldFeedback(`member_${i}_usn`)}
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="USN *"
                                  value={m.usn}
                                  onChange={(e) => setMemberField(i, 'usn', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'usn')}
                                  style={getInputStyle(`member_${i}_usn`)}
                                />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                {renderFieldFeedback(`member_${i}_email`)}
                                <input
                                  type="email"
                                  className="form-input"
                                  placeholder="Email (Optional)"
                                  value={m.email}
                                  onChange={(e) => setMemberField(i, 'email', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'email')}
                                  style={getInputStyle(`member_${i}_email`)}
                                />
                              </div>
                              <div className="form-group">
                                {renderFieldFeedback(`member_${i}_phone`)}
                                <input
                                  type="tel"
                                  className="form-input"
                                  placeholder="Phone *"
                                  value={m.phone}
                                  onChange={(e) => setMemberField(i, 'phone', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'phone')}
                                  style={getInputStyle(`member_${i}_phone`)}
                                />
                              </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '4px' }}>
                              {renderFieldFeedback(`member_${i}_dept`)}
                              <select
                                className="form-select"
                                value={m.dept || ''}
                                onChange={(e) => setMemberField(i, 'dept', e.target.value)}
                                onBlur={() => handleMemberBlur(i, 'dept')}
                                style={getInputStyle(`member_${i}_dept`)}
                              >
                                <option value="">Select Member Department</option>
                                {DEPARTMENTS.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Submit button */}
                {(!lockedDept || isHighSem || isEligibleSem1) && (
                  <button
                    type="submit"
                    className="btn-register"
                    disabled={step === 'submitting'}
                    style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '1.05rem' }}
                  >
                    {step === 'submitting' ? 'Processing...' : isWorkshop ? 'Confirm Free Workshop Seat' : 'Proceed to Payment'}
                  </button>
                )}
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
