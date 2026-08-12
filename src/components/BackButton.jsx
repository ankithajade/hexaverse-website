import { useNavigate } from 'react-router-dom';

/**
 * Reusable BackButton component.
 * Performs browser back navigation (`navigate(-1)`) if history exists,
 * otherwise falls back to home (`/`).
 */
export default function BackButton({ style = {} }) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there is history in the current session
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="btn-back"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: 'none',
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.88rem',
        fontWeight: 600,
        cursor: 'pointer',
        padding: '6px 0',
        transition: 'color 0.2s ease',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cyan)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span>Back</span>
    </button>
  );
}
