import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { departments } from '../data/departments';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import BackButton from '../components/BackButton';
import DeptAccordionCard from '../components/DeptAccordionCard';
import ScrollReveal from '../components/ScrollReveal';
import RichText from '../components/RichText';

/**
 * Single dynamic component for all 6 department pages.
 * Route: /departments/:deptId
 * Driven by data/departments.js — no duplicate JSX for each dept.
 */
export default function DepartmentPage() {
  const { deptId } = useParams();
  const [searchParams] = useSearchParams();
  const dept = departments[deptId];
  const initialTab = searchParams.get('tab') === 'event' || searchParams.get('tab') === 'signature'
    ? 'Signature Event'
    : 'Workshop';
  const [activeTab, setActiveTab] = useState(initialTab);

  // 404 if unknown dept id
  if (!dept) return <Navigate to="/" replace />;

  useEffect(() => {
    document.title = dept.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', dept.metaDesc);
    // Scroll to top on dept page load
    window.scrollTo(0, 0);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'event' || tabParam === 'signature') {
      setActiveTab('Signature Event');
    } else {
      setActiveTab('Workshop');
    }
  }, [dept, searchParams]);

  return (
    // --dept-accent scoped to this page, same as original body style="--dept-accent:var(--cse);"
    <div style={{ '--dept-accent': dept.cssVar }}>
      <Nav />

      {/* Back Button & Breadcrumb */}
      <div className="container" style={{ paddingTop: '90px' }}>
        <BackButton style={{ marginBottom: '12px' }} />
        <ScrollReveal className="dept-breadcrumb" style={{ padding: 0 }}>
          <Link to="/">Home</Link> <span>/</span>{' '}
          <Link to="/#departments">Departments</Link> <span>/</span>{' '}
          <span>{dept.name}</span>
        </ScrollReveal>
      </div>

      {/* Hero */}
      <ScrollReveal as="section" className="dept-hero">
        <div className="container">
          <div className="dept-hero-layout">
            <div className="dept-hero-content">
              <div className="dept-hero-badge">{dept.badge}</div>
              <h1>{dept.name}</h1>
              <p className="dept-hero-dates">{dept.dates}</p>
              <RichText className="dept-hero-desc">{dept.description}</RichText>
            </div>
            <div className="dept-hero-media" aria-hidden="true">
              <img
                src={dept.heroImage || '/assets/dept-hero-default.png'}
                alt=""
                className="dept-hero-img"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Event cards */}
      <section className="container">
        {/* Mobile-only tab toggle */}
        <div className="dept-mobile-tabs">
          <button
            type="button"
            className={`dept-tab-btn ${activeTab === 'Workshop' ? 'active' : ''}`}
            onClick={() => setActiveTab('Workshop')}
          >
            Workshop
          </button>
          <button
            type="button"
            className={`dept-tab-btn ${activeTab === 'Signature Event' ? 'active' : ''}`}
            onClick={() => setActiveTab('Signature Event')}
          >
            Signature Event
          </button>
        </div>

        <ScrollReveal stagger className="event-cards">
          {dept.events.map((ev) => (
            <DeptAccordionCard
              key={ev.eventId}
              type={ev.type}
              title={ev.title}
              description={ev.description}
              dates={ev.dates}
              venue={ev.venue}
              eventId={ev.eventId}
              eventTitle={ev.eventTitle}
              isTeam={ev.isTeam}
              isInterCollege={ev.isInterCollege}
              className={ev.type !== activeTab ? 'dept-card--mobile-hidden' : ''}
            />
          ))}
        </ScrollReveal>
      </section>

      <Footer accentColor={dept.cssVar} />
      <BackToTop />
    </div>
  );
}
