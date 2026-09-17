import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { registrationEvents } from '../data/registrationEvents';
import {
  isValidUSN,
  isValidEmail,
  isValidPhone,
  isUSNEligibleForDept,
} from '../lib/validators';
import {
  getEventConfig,
  checkTeamNameAvailability,
  submitRegistration,
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
const PHYSICS_CYCLE_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const CHEMISTRY_CYCLE_SECTIONS = ['I', 'J', 'K', 'L', 'M', 'N', 'P'];

function getSem1Sections(cycle) {
  if (cycle === 'Physics Cycle') return PHYSICS_CYCLE_SECTIONS;
  if (cycle === 'Chemistry Cycle') return CHEMISTRY_CYCLE_SECTIONS;
  return [];
}
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

const EMPTY_MEMBER = {
  name: '',
  phone: '',
  email: '',
  semester: '',
  section: '',
  dept: '',
  cycle: '',
  selectedDept: '',
  rollNumber: '',
  usn: '',
};

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

  const minMembers = slug === 'treasure-hunt' ? 3 : (eventConfig?.team_min || event.teamMin || (isTeam ? 2 : 1));
  const maxMembers = slug === 'treasure-hunt' ? 3 : (eventConfig?.team_max || event.teamMax || (isTeam ? 4 : 1));
  const maxAdditional = maxMembers - 1;

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
            setMembers(Array.from({ length: neededAddl }, () => ({
              ...EMPTY_MEMBER,
              dept: lockedDeptFullName || '',
            })));
          }
        }
      } catch (err) {
        console.warn('Fallback to local event config', err);
      }
    }
    loadEvent();
    return () => { isMounted = false; };
  }, [eventId, slug, lockedDeptFullName, event.eventTitle]);

  // Derived: semester checks for lead
  const sem = Number(form.semester);
  const isHighSem = Boolean(lockedDept && [3, 5, 7].includes(sem));
  const isSem1 = Boolean(sem === 1);
  const isEligibleSem1Dept = Boolean(
    form.selectedDept &&
    lockedDept &&
    (form.selectedDept === lockedDept.id || (lockedDept.id === 'ece' && form.selectedDept === 'iot_cyber'))
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'cycle') {
        next.section = '';
      }
      return next;
    });
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
      setMembers((m) => [
        ...m,
        { ...EMPTY_MEMBER, dept: lockedDeptFullName || '' },
      ]);
    }
  };

  const removeMember = (i) => {
    setMembers((m) => m.filter((_, idx) => idx !== i));
    setTouched((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`member_${i}_`)) delete next[k];
      });
      return next;
    });
  };

  const setMemberField = (i, field, value) => {
    setMembers((m) => m.map((mb, idx) => {
      if (idx !== i) return mb;
      const updated = { ...mb, [field]: value };
      if (field === 'cycle') {
        updated.section = '';
      }
      return updated;
    }));
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
      // Mega event path (Treasure Hunt)
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
        }
      } else if ([3, 5, 7].includes(currentSem)) {
        if (!formData.section) {
          errors.section = 'Please select your section';
        }
        if (!formData.usn?.trim()) {
          errors.usn = 'USN is required';
        } else if (!isValidUSN(formData.usn)) {
          errors.usn = 'Invalid USN format (e.g. 1DB23CS001)';
        }
        if (!formData.dept) {
          errors.dept = 'Please select your department';
        }
      }
    }

    if (isTeam) {
      const totalCount = 1 + memberList.length;
      if (slug === 'treasure-hunt') {
        if (totalCount !== 3) {
          errors.teamMembers = `Treasure Hunt requires exactly 3 members (Lead + 2 members)`;
        }
      } else {
        if (totalCount < minMembers) {
          errors.teamMembers = `Minimum ${minMembers} team members required (Lead + ${minMembers - 1} members)`;
        } else if (totalCount > maxMembers) {
          errors.teamMembers = `Maximum ${maxMembers} team members allowed`;
        }
      }

      const allUsns = [];
      if (Number(formData.semester) !== 1 && formData.usn?.trim()) {
        allUsns.push({ key: 'usn', usn: formData.usn.trim().toUpperCase() });
      }

      memberList.forEach((m, i) => {
        const mSem = Number(m.semester);
        const memberNum = i + 2;

        if (!m.name?.trim()) {
          errors[`member_${i}_name`] = `Member ${memberNum} Name is required`;
        }

        if (!m.phone?.trim()) {
          errors[`member_${i}_phone`] = `Member ${memberNum} Phone is required`;
        } else if (!isValidPhone(m.phone)) {
          errors[`member_${i}_phone`] = 'Enter a valid 10-digit mobile number';
        }

        if (m.email?.trim() && !isValidEmail(m.email)) {
          errors[`member_${i}_email`] = 'Please enter a valid email address';
        }

        if (!m.semester) {
          errors[`member_${i}_semester`] = `Member ${memberNum} Semester is required`;
        }

        if (!m.section) {
          errors[`member_${i}_section`] = `Member ${memberNum} Section is required`;
        }

        if (mSem === 1) {
          if (!m.rollNumber?.trim()) {
            errors[`member_${i}_rollNumber`] = `Member ${memberNum} Roll Number is required`;
          }
          if (!m.cycle) {
            errors[`member_${i}_cycle`] = `Member ${memberNum} Cycle is required`;
          }
          if (!m.selectedDept) {
            errors[`member_${i}_selectedDept`] = `Member ${memberNum} Department is required`;
          } else if (lockedDept) {
            const isEligible = m.selectedDept === lockedDept.id || (lockedDept.id === 'ece' && m.selectedDept === 'iot_cyber');
            if (!isEligible) {
              errors[`member_${i}_selectedDept`] = `Member ${memberNum} is not eligible for this event`;
            }
          }
        } else if ([3, 5, 7].includes(mSem)) {
          if (!m.usn?.trim()) {
            errors[`member_${i}_usn`] = `Member ${memberNum} USN is required`;
          } else if (!isValidUSN(m.usn)) {
            errors[`member_${i}_usn`] = `Member ${memberNum} USN format is invalid`;
          } else if (lockedDept && !isUSNEligibleForDept(m.usn, lockedDept.id)) {
            errors[`member_${i}_usn`] = `Member ${memberNum} is not eligible for this event`;
          } else {
            allUsns.push({ key: `member_${i}_usn`, usn: m.usn.trim().toUpperCase() });
          }

          if (!lockedDept && !m.dept) {
            errors[`member_${i}_dept`] = `Member ${memberNum} Department is required`;
          }
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
            if (lockedDept && [3, 5, 7].includes(Number(member.semester)) && !isUSNEligibleForDept(member.usn, lockedDept.id)) {
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

  const getInputStyle = (key) => {
    const fb = getFieldFeedback(key);
    if (fb?.hasError) {
      return { borderColor: '#ef4444' };
    }
    return {};
  };

  // ── Submission & Cashfree Checkout ────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    const errors = validateForm(form, members);
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const el = document.querySelector(`[name="${firstErrorField}"], [id="reg-${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setStep('submitting');
    setServerError('');

    const leadSemNum = Number(form.semester);
    const leadIsSem1 = leadSemNum === 1;

    const teamLead = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      semester: leadSemNum,
      section: form.section.trim(),
      dept: leadIsSem1 ? form.selectedDept : (lockedDeptFullName || form.dept),
      cycle: leadIsSem1 ? form.cycle : null,
      roll_number: leadIsSem1 ? form.rollNumber.trim() : null,
      usn: leadIsSem1 ? null : form.usn.trim().toUpperCase(),
    };

    try {
      if (isWorkshop) {
        // Individual free registration
        const payload = {
          event_slug: slug,
          registrant: teamLead,
        };
        const res = await submitRegistration(payload);
        if (res.success) {
          setStep('success');
        } else {
          setServerError(res.error || 'Registration failed.');
          setStep('form');
        }
      } else {
        // Team paid registration
        const teamMembersPayload = [
          teamLead,
          ...members.map((m) => {
            const mSem = Number(m.semester);
            const mIsSem1 = mSem === 1;
            return {
              name: m.name.trim(),
              phone: m.phone.trim(),
              email: m.email?.trim() ? m.email.trim().toLowerCase() : null,
              semester: mSem,
              section: m.section ? m.section.trim() : null,
              dept: mIsSem1 ? m.selectedDept : (lockedDeptFullName || m.dept),
              cycle: mIsSem1 ? m.cycle : null,
              roll_number: mIsSem1 ? m.rollNumber?.trim() : null,
              usn: mIsSem1 ? null : m.usn?.trim().toUpperCase(),
            };
          }),
        ];

        const payload = {
          event_slug: slug,
          team_name: form.teamName.trim(),
          registrant: teamLead,
          team_members: teamMembersPayload,
        };

        const res = await submitRegistration(payload);

        if (res.payment_session_id) {
          setPaymentData(res);
          setStep('payment_checkout');
          launchCashfreeCheckout(res.payment_session_id);
        } else if (res.success && res.is_free) {
          setStep('success');
        } else {
          setServerError(res.error || 'Failed to initialize payment.');
          setStep('form');
        }
      }
    } catch (err) {
      setServerError(err.message || 'Registration request failed. Please try again.');
      setStep('form');
    }
  };

  const launchCashfreeCheckout = async (paymentSessionId) => {
    try {
      if (!window.Cashfree) {
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const cashfree = window.Cashfree({
        mode: 'production',
      });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: '_self',
      }).then((result) => {
        if (result?.error) {
          setServerError(result.error.message || 'Payment was cancelled or failed.');
          setStep('form');
        }
      }).catch((err) => {
        console.warn('[Cashfree] Checkout interaction notice:', err);
      });
    } catch (err) {
      setServerError('Unable to open payment gateway. Please try again.');
      setStep('form');
    }
  };

  const totalFee = isWorkshop ? 0 : event.fee * (1 + members.length);

  return (
    <div style={{ '--dept-accent': lockedDept ? `var(--${lockedDept.id}-accent)` : 'var(--mega-accent)' }}>
      <Nav />

      <div className="container" style={{ paddingTop: '90px' }}>
        <BackButton style={{ marginBottom: '12px' }} />
        <ScrollReveal className="dept-breadcrumb" style={{ padding: 0 }}>
          <Link to="/">Home</Link> <span>/</span>{' '}
          {lockedDept ? (
            <>
              <Link to={`/departments/${lockedDept.id}`}>{lockedDeptFullName}</Link> <span>/</span>{' '}
            </>
          ) : (
            <>
              <Link to="/#events">Mega Events</Link> <span>/</span>{' '}
            </>
          )}
          <span>Register · {event.eventTitle}</span>
        </ScrollReveal>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: '900px' }}>

          {/* ══════════════════════════════════════════════════════
              STEP: SUCCESS
              ══════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <ScrollReveal className="mega-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: '16px' }}><FiCheckCircle /></div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '12px', color: 'var(--text)' }}>
                Registration Confirmed!
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 24px' }}>
                {isWorkshop
                  ? `You have successfully registered for the ${event.eventTitle}. A confirmation email has been sent.`
                  : `Your team "${form.teamName}" is successfully registered for ${event.eventTitle}! Payment has been verified.`}
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/" className="btn-dept-register" style={{ textDecoration: 'none', padding: '12px 28px' }}>
                  Return to Home
                </Link>
                {lockedDept && (
                  <Link to={`/departments/${lockedDept.id}`} className="btn-dept-register" style={{ textDecoration: 'none', padding: '12px 28px', background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text)' }}>
                    Back to Department
                  </Link>
                )}
              </div>
            </ScrollReveal>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP: PAYMENT CHECKOUT / VERIFYING
              ══════════════════════════════════════════════════════ */}
          {(step === 'payment_checkout' || step === 'verifying_payment') && (
            <ScrollReveal className="mega-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px', width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <h3 style={{ fontFamily: 'var(--font-subheading)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '8px' }}>
                {step === 'payment_checkout' ? 'Processing Payment...' : 'Verifying Payment Status...'}
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                Please complete the UPI transaction in the gateway modal. Do not refresh or close this tab.
              </p>
            </ScrollReveal>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP: REGISTRATION FORM
              ══════════════════════════════════════════════════════ */}
          {(step === 'form' || step === 'submitting') && (
            <>
              {/* Event Overview Summary Card */}
              <ScrollReveal className="mega-card" style={{ marginBottom: '32px', padding: '28px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="open-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>
                      {isWorkshop ? 'Hands-on Workshop' : (slug === 'treasure-hunt' ? 'Mega Event' : 'Department Signature Event')}
                    </span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text)', margin: '4px 0 8px' }}>
                      {event.eventTitle}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', margin: 0 }}>
                      {event.dates} {event.venue ? `· ${event.venue}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '140px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Registration Fee
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isWorkshop ? '#10b981' : 'var(--cyan)' }}>
                      {isWorkshop ? 'Free' : `₹${event.fee}`}
                      {!isWorkshop && <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-dim)' }}> / head</span>}
                    </div>
                    {!isWorkshop && (
                      <>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Total: <strong>₹{totalFee}</strong> ({1 + members.length} {1 + members.length === 1 ? 'member' : 'members'})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.85 }}>
                          Includes ₹2/head payment gateway fee (Cashfree)
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isTeam && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--bg-card-border)',
                      borderRadius: '6px',
                      fontSize: '0.88rem',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Team Size:</span>
                    <strong style={{ color: 'var(--cyan)' }}>
                      {minMembers === maxMembers ? `Exactly ${minMembers} members` : `${minMembers}–${maxMembers} members`}
                    </strong>
                  </div>
                )}

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

              {/* Registration Form */}
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

                  {/* Full Name */}
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

                  {/* Email + Phone */}
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

                  {/* Semester + (Section/USN for Sem 3/5/7 OR Cycle/Roll for Sem 1) */}
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

                    {!isSem1 ? (
                      <>
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
                              <option key={s} value={s}>Section {s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sem 3/5/7: USN */}
                        {[3, 5, 7].includes(sem) && (
                          <div className="form-group">
                            <label htmlFor="reg-usn">USN *</label>
                            {renderFieldFeedback('usn')}
                            <input
                              id="reg-usn"
                              name="usn"
                              type="text"
                              className="form-input"
                              placeholder={lockedDept ? `e.g. 1DB23${lockedDept.id === 'aiml' ? 'CI' : 'CS'}001` : 'e.g. 1DB23CS001'}
                              value={form.usn}
                              onChange={setField}
                              onBlur={handleBlur}
                              style={getInputStyle('usn')}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Sem 1: Cycle */}
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

                        {/* Sem 1: Roll Number */}
                        <div className="form-group">
                          <label htmlFor="reg-rollNumber">Roll Number *</label>
                          {renderFieldFeedback('rollNumber')}
                          <input
                            id="reg-rollNumber"
                            name="rollNumber"
                            type="text"
                            className="form-input"
                            placeholder="e.g. 24CS01"
                            value={form.rollNumber}
                            onChange={setField}
                            onBlur={handleBlur}
                            style={getInputStyle('rollNumber')}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sem 1 Extra Row: Section + Department */}
                  {isSem1 && (
                    <>
                      <div className="form-row">
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
                            disabled={!form.cycle}
                            style={getInputStyle('section')}
                          >
                            <option value="">{form.cycle ? 'Select Section' : 'Select Cycle first'}</option>
                            {getSem1Sections(form.cycle).map((s) => (
                              <option key={s} value={s}>Section {s}</option>
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

                      {lockedDept && form.selectedDept && !isEligibleSem1Dept && (
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

                  {/* Sem 3/5/7 Department selection for Mega Events */}
                  {!lockedDept && [3, 5, 7].includes(sem) && (
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
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Locked Department Banner for Sem 3/5/7 */}
                  {lockedDept && isHighSem && (
                    <div className="form-group">
                      <div style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 600, marginBottom: '8px' }}>
                        Only {lockedDeptFullName} students can join this event.
                      </div>
                      <label>Department</label>
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

                  {/* ══════════════════════════════════════════════════
                      ADDITIONAL TEAM MEMBERS
                      ══════════════════════════════════════════════════ */}
                  {isTeam && (
                    <div className="team-section" style={{ marginTop: '28px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div className="team-section-title" style={{ margin: 0, padding: 0, border: 'none', fontWeight: 700 }}>
                          Additional Members ({members.length} added · {minMembers - 1} min required)
                        </div>
                        {slug !== 'treasure-hunt' && (
                          <button
                            type="button"
                            className="btn-add-member"
                            onClick={addMember}
                            disabled={members.length >= maxAdditional}
                            style={{ width: 'auto', margin: 0, padding: '6px 14px' }}
                          >
                            + Add Member
                          </button>
                        )}
                      </div>

                      {hasSubmitted && formErrors.teamMembers && (
                        <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                          <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '4px' }} />{formErrors.teamMembers}
                        </div>
                      )}

                      {members.map((m, i) => {
                        const mSemNum = Number(m.semester);
                        const mIsSem1 = mSemNum === 1;
                        const mIsHighSem = [3, 5, 7].includes(mSemNum);

                        return (
                          <div
                            key={i}
                            className="team-member-row"
                            style={{
                              marginBottom: '20px',
                              padding: '20px',
                              background: 'var(--bg)',
                              border: '1px solid var(--bg-card-border)',
                              borderRadius: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                              <span>Member {i + 2}</span>
                              {slug !== 'treasure-hunt' && i >= (minMembers - 1) && (
                                <button
                                  type="button"
                                  className="btn-remove-member"
                                  onClick={() => removeMember(i)}
                                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {/* Full Name */}
                            <div className="form-group">
                              <label>Full Name *</label>
                              {renderFieldFeedback(`member_${i}_name`)}
                              <input
                                type="text"
                                className="form-input"
                                placeholder={`Member ${i + 2} Full Name`}
                                value={m.name}
                                onChange={(e) => setMemberField(i, 'name', e.target.value)}
                                onBlur={() => handleMemberBlur(i, 'name')}
                                style={getInputStyle(`member_${i}_name`)}
                              />
                            </div>

                            {/* Email + Phone */}
                            <div className="form-row">
                              <div className="form-group">
                                <label>Email (Optional)</label>
                                {renderFieldFeedback(`member_${i}_email`)}
                                <input
                                  type="email"
                                  className="form-input"
                                  placeholder="member@email.com"
                                  value={m.email}
                                  onChange={(e) => setMemberField(i, 'email', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'email')}
                                  style={getInputStyle(`member_${i}_email`)}
                                />
                              </div>
                              <div className="form-group">
                                <label>Phone *</label>
                                {renderFieldFeedback(`member_${i}_phone`)}
                                <input
                                  type="tel"
                                  className="form-input"
                                  placeholder="10-digit mobile"
                                  value={m.phone}
                                  onChange={(e) => setMemberField(i, 'phone', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'phone')}
                                  style={getInputStyle(`member_${i}_phone`)}
                                />
                              </div>
                            </div>

                            {/* Semester + (Section/USN for Sem 3/5/7 OR Cycle/Roll for Sem 1) */}
                            <div className="form-row">
                              <div className="form-group">
                                <label>Semester *</label>
                                {renderFieldFeedback(`member_${i}_semester`)}
                                <select
                                  className="form-select"
                                  value={m.semester}
                                  onChange={(e) => setMemberField(i, 'semester', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'semester')}
                                  style={getInputStyle(`member_${i}_semester`)}
                                >
                                  <option value="">Select Semester</option>
                                  {SEMESTERS.map((s) => (
                                    <option key={s} value={s}>Semester {s}</option>
                                  ))}
                                </select>
                              </div>

                              {!mIsSem1 ? (
                                <>
                                  <div className="form-group">
                                    <label>Section *</label>
                                    {renderFieldFeedback(`member_${i}_section`)}
                                    <select
                                      className="form-select"
                                      value={m.section}
                                      onChange={(e) => setMemberField(i, 'section', e.target.value)}
                                      onBlur={() => handleMemberBlur(i, 'section')}
                                      style={getInputStyle(`member_${i}_section`)}
                                    >
                                      <option value="">Select Section</option>
                                      {SECTIONS.map((s) => (
                                        <option key={s} value={s}>Section {s}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Sem 3/5/7: USN */}
                                  {mIsHighSem && (
                                    <div className="form-group">
                                      <label>USN *</label>
                                      {renderFieldFeedback(`member_${i}_usn`)}
                                      <input
                                        type="text"
                                        className="form-input"
                                        placeholder={lockedDept ? `e.g. 1DB23${lockedDept.id === 'aiml' ? 'CI' : 'CS'}001` : 'e.g. 1DB23CS001'}
                                        value={m.usn}
                                        onChange={(e) => setMemberField(i, 'usn', e.target.value)}
                                        onBlur={() => handleMemberBlur(i, 'usn')}
                                        style={getInputStyle(`member_${i}_usn`)}
                                      />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {/* Sem 1: Cycle */}
                                  <div className="form-group">
                                    <label>Cycle *</label>
                                    {renderFieldFeedback(`member_${i}_cycle`)}
                                    <select
                                      className="form-select"
                                      value={m.cycle}
                                      onChange={(e) => setMemberField(i, 'cycle', e.target.value)}
                                      onBlur={() => handleMemberBlur(i, 'cycle')}
                                      style={getInputStyle(`member_${i}_cycle`)}
                                    >
                                      <option value="">Select Cycle</option>
                                      {CYCLES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Sem 1: Roll Number */}
                                  <div className="form-group">
                                    <label>Roll Number *</label>
                                    {renderFieldFeedback(`member_${i}_rollNumber`)}
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="e.g. 24CS02"
                                      value={m.rollNumber}
                                      onChange={(e) => setMemberField(i, 'rollNumber', e.target.value)}
                                      onBlur={() => handleMemberBlur(i, 'rollNumber')}
                                      style={getInputStyle(`member_${i}_rollNumber`)}
                                    />
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Member Sem 1: Section + Department */}
                            {mIsSem1 && (
                              <>
                                <div className="form-row">
                                  <div className="form-group">
                                    <label>Section *</label>
                                    {renderFieldFeedback(`member_${i}_section`)}
                                    <select
                                      className="form-select"
                                      value={m.section}
                                      onChange={(e) => setMemberField(i, 'section', e.target.value)}
                                      onBlur={() => handleMemberBlur(i, 'section')}
                                      disabled={!m.cycle}
                                      style={getInputStyle(`member_${i}_section`)}
                                    >
                                      <option value="">{m.cycle ? 'Select Section' : 'Select Cycle first'}</option>
                                      {getSem1Sections(m.cycle).map((s) => (
                                        <option key={s} value={s}>Section {s}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="form-group">
                                    <label>Department *</label>
                                    {renderFieldFeedback(`member_${i}_selectedDept`)}
                                    <select
                                      className="form-select"
                                      value={m.selectedDept}
                                      onChange={(e) => setMemberField(i, 'selectedDept', e.target.value)}
                                      onBlur={() => handleMemberBlur(i, 'selectedDept')}
                                      style={getInputStyle(`member_${i}_selectedDept`)}
                                    >
                                      <option value="">Select Department</option>
                                      {SEM1_DEPARTMENTS.map((d) => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {lockedDept && m.selectedDept && !(m.selectedDept === lockedDept.id || (lockedDept.id === 'ece' && m.selectedDept === 'iot_cyber')) && (
                                  <div
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid #ef4444',
                                      color: '#dc2626',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      marginBottom: '8px',
                                    }}
                                  >
                                    Member {i + 2} is not eligible for this event
                                  </div>
                                )}
                              </>
                            )}

                            {/* Member Sem 3/5/7 Department selection for Mega Events */}
                            {!lockedDept && mIsHighSem && (
                              <div className="form-group">
                                <label>Department *</label>
                                {renderFieldFeedback(`member_${i}_dept`)}
                                <select
                                  className="form-select"
                                  value={m.dept}
                                  onChange={(e) => setMemberField(i, 'dept', e.target.value)}
                                  onBlur={() => handleMemberBlur(i, 'dept')}
                                  style={getInputStyle(`member_${i}_dept`)}
                                >
                                  <option value="">Select Department</option>
                                  {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Locked Department Tag */}
                            {lockedDept && mIsHighSem && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                Department: <strong style={{ color: 'var(--text)' }}>{lockedDeptFullName}</strong>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ marginTop: '32px' }}>
                    <button
                      type="submit"
                      className="btn-dept-register"
                      disabled={step === 'submitting'}
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '1.1rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      {step === 'submitting' ? (
                        <>
                          <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <span>Processing Registration...</span>
                        </>
                      ) : isWorkshop ? (
                        'Confirm Free Workshop Registration'
                      ) : (
                        `Proceed to Pay ₹${totalFee}`
                      )}
                    </button>
                    {!isWorkshop && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FiLock style={{ verticalAlign: 'middle' }} /> Powered by Cashfree UPI Gateway. 100% Secure Checkout.
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          (Includes ₹2/head payment gateway fee charged by Cashfree)
                        </span>
                      </div>
                    )}
                  </div>

                </form>
              </ScrollReveal>
            </>
          )}

        </div>
      </section>

      <Footer accentColor={lockedDept ? `var(--${lockedDept.id}-accent)` : 'var(--mega-accent)'} />
      <BackToTop />
    </div>
  );
}
