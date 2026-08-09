import { useRef, useState } from 'react';
import { useModal } from '../context/ModalContext';

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
 * A department event card with an accordion "Details" toggle.
 *
 * Replaces the vanilla JS maxHeight accordion from script.js.
 * Uses useState for open/close and a ref to read scrollHeight for
 * smooth CSS max-height transition.
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
  accordionContent,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const accordionRef = useRef(null);
  const { openModal } = useModal();

  const toggle = () => setIsOpen((prev) => !prev);

  const maxHeight = isOpen
    ? (accordionRef.current ? accordionRef.current.scrollHeight + 'px' : '600px')
    : '0px';

  return (
    <div className="event-card">
      <div className="event-card-type">{type}</div>
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="event-card-meta">
        <span>
          <CalendarIcon /> {dates}
        </span>
        <span>
          <LocationIcon /> {venue}
        </span>
      </div>

      <div className="event-card-actions">
        <button className="btn-details" onClick={toggle}>
          {isOpen ? 'Hide Details' : 'Details'}
        </button>
        <button
          className="btn-dept-register"
          onClick={() => openModal(eventId, eventTitle, isTeam, isInterCollege, { eventSlug: eventId })}
        >
          Register
        </button>
      </div>

      <div
        className={`accordion-content${isOpen ? ' open' : ''}`}
        ref={accordionRef}
        style={{ maxHeight }}
      >
        <div className="accordion-inner">
          <p>{accordionContent}</p>
        </div>
      </div>
    </div>
  );
}
