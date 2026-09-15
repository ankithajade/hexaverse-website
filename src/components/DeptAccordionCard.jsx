import { useNavigate } from 'react-router-dom';
import RichText from './RichText';

// SVG icon helpers
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * A department event card with a "Details" PDF link.
 */
export default function DeptAccordionCard({
  type,
  title,
  description,
  dates,
  venue,
  eventId,
  eventTitle,
  isTeam = false,
  isInterCollege = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="event-card">
      <div className="event-card-type">{type}</div>
      <h2>{title}</h2>
      <RichText className="event-card-desc">{description}</RichText>

      <div className="event-card-meta">
        <span>
          <CalendarIcon /> {dates}
        </span>
        <span>
          <LocationIcon /> {venue}
        </span>
      </div>

      <div className="event-card-actions">
        <a
          href={`/pdfs/${eventId}.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-details"
        >
          Details
        </a>
        <button
          className="btn-dept-register"
          onClick={() => navigate(`/register/${eventId}`)}
        >
          Register
        </button>
      </div>
    </div>
  );
}
