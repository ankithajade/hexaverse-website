import { useEffect } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { events } from '../data/events';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import BackButton from '../components/BackButton';
import ScrollReveal from '../components/ScrollReveal';
import RichText from '../components/RichText';

// ── SVG icons ────────────────────────────────────────────────────────────────
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
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const ICON_MAP = { calendar: CalendarIcon, location: LocationIcon, people: PeopleIcon };

/**
 * Single dynamic component for all 3 mega-event pages.
 * Route: /events/:eventId
 * Driven by data/events.js — replaces 3 near-identical HTML pages.
 */
export default function EventPage() {
  const { eventId } = useParams();
  const event = events[eventId];
  const navigate = useNavigate();

  if (!event) return <Navigate to="/" replace />;

  useEffect(() => {
    document.title = event.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', event.metaDesc);
    window.scrollTo(0, 0);
  }, [event]);

  const handleRegister = () => {
    navigate(`/register/${event.registrationEventId || event.id}`);
  };

  return (
    <div style={{ '--dept-accent': event.cssVar }}>
      <Nav />

      {/* Back Button & Breadcrumb */}
      <div className="container" style={{ paddingTop: '90px' }}>
        <BackButton style={{ marginBottom: '12px' }} />
        <ScrollReveal className="dept-breadcrumb" style={{ padding: 0 }}>
          <Link to="/">Home</Link> <span>/</span>{' '}
          <Link to="/#events">Mega Events</Link> <span>/</span>{' '}
          <span>{event.title}</span>
        </ScrollReveal>
      </div>

      {/* Hero */}
      <ScrollReveal as="section" className="dept-hero">
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className="dept-hero-badge">{event.badge}</div>
            <h1>{event.title}</h1>
            <p className="dept-hero-dates">{event.dates}</p>
            <RichText className="dept-hero-desc">{event.description}</RichText>
          </div>
          <div style={{ alignSelf: 'center', marginTop: '12px' }}>
            {event.id === 'hackathon' ? (
              <a
                href="https://forms.example.com/hexaverse-hackathon-registration"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dept-register"
                style={{ padding: '14px 28px', fontSize: '1.05rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Register Now!
              </a>
            ) : (
              <button
                className="btn-dept-register"
                style={{ padding: '14px 28px', fontSize: '1.05rem' }}
                onClick={handleRegister}
              >
                Register Now!
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Detail card */}
      <section className="container" style={{ marginBottom: '80px' }}>
        <ScrollReveal
          className="event-card"
          style={{ borderTop: '4px solid var(--mega-accent)', maxWidth: '100%' }}
        >
          <div className="event-card-type">Event Details</div>
          <h2>Overview &amp; Guidelines</h2>

          {/* Meta items */}
          <div className="event-card-meta" style={{ marginTop: '20px' }}>
            {event.metaItems.map((item, i) => {
              const Icon = ICON_MAP[item.icon];
              return (
                <span key={i}>
                  <Icon /> {item.text}
                </span>
              );
            })}
          </div>

          {/* Content sections */}
          <div style={{ marginTop: '32px' }}>
            {event.sections.map((section, i) => (
              <div key={i}>
                <h3
                  style={{
                    fontFamily: 'var(--font-subheading)',
                    color: 'var(--text)',
                    marginBottom: '12px',
                  }}
                >
                  {section.heading}
                </h3>

                {section.type === 'list' ? (
                  <ul
                    style={{
                      color: 'var(--text-dim)',
                      lineHeight: '1.8',
                      marginBottom: '24px',
                      paddingLeft: '20px',
                      listStyleType: 'disc',
                    }}
                  >
                    {section.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p
                    style={{
                      color: 'var(--text-dim)',
                      lineHeight: '1.7',
                      marginBottom: i === event.sections.length - 1 ? '32px' : '24px',
                    }}
                  >
                    {section.strongPrefix && (
                      <strong>{section.strongPrefix} </strong>
                    )}
                    {section.text}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Bottom register CTA */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '24px',
              borderTop: '1px solid var(--bg-card-border)',
            }}
          >
            {event.id === 'hackathon' ? (
              <a
                href="https://forms.example.com/hexaverse-hackathon-registration"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dept-register"
                style={{ padding: '14px 40px', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Register Now!
              </a>
            ) : (
              <button
                className="btn-dept-register"
                style={{ padding: '14px 40px', fontSize: '1.1rem' }}
                onClick={handleRegister}
              >
                Register Now!
              </button>
            )}
          </div>
        </ScrollReveal>
      </section>

      <Footer accentColor={event.cssVar} />
      <BackToTop />
    </div>
  );
}
