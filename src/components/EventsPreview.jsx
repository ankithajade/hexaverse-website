import { Link } from 'react-router-dom';
import { FaGlobe } from 'react-icons/fa';
import ScrollReveal from './ScrollReveal';
import HexGridOverlay from './HexGridOverlay';

/**
 * EventsPreview — 3-column mega-grid.
 * Item 6: Replaced progressive-blur-on-hover with enlarge-on-hover via CSS
 * (.mega-card:hover in styles.css handles scale(1.04) translateY(-6px)).
 * MegaCard wrapper removed — cards render directly with className="mega-card".
 */
export default function EventsPreview() {
  return (
    <section className="section" id="events">
      <HexGridOverlay />
      <div className="container">
        <ScrollReveal>
          <div className="section-label">Campus-Wide</div>
          <h2 className="section-title">Mega Events</h2>
          <p className="section-desc">
            Three large-scale events across the series. Every department. Every student. No limits.
          </p>
        </ScrollReveal>

        {/* mega-grid CSS: repeat(3, 1fr) */}
        <ScrollReveal stagger className="mega-grid">
          {/* Treasure Hunt */}
          <div className="mega-card">
            <div className="mega-card-label">After Week 1</div>
            <h4>Treasure Hunt</h4>
            <p>Cross-campus challenge blending logic, teamwork, and tech.</p>
            <div className="mega-card-date">25 Sept 2026</div>
            <div className="mega-card-badges">
              <span className="open-badge">Open to all departments</span>
            </div>
            <Link to="/events/treasure-hunt" className="btn-register">Details</Link>
          </div>
          
          {/* Hackathon */}
          <div className="mega-card">
            <div className="mega-card-label">After Week 5</div>
            <h4>Hackathon</h4>
            <p>Build. Ship. Compete. A flagship coding marathon open beyond DBIT.</p>
            <div className="mega-card-date">30 &ndash; 31 Oct 2026</div>
            <div className="mega-card-badges">
              <span className="open-badge">Open to all departments</span>
              <span className="inter-college-badge">
                <FaGlobe style={{ verticalAlign: 'middle', marginRight: '4px', fontSize: '0.7em' }} />
                Inter-College Event
              </span>
            </div>
            <Link to="/events/hackathon" className="btn-register">Details</Link>
          </div>

          {/* Technical Talk */}
          <div className="mega-card">
            <div className="mega-card-label">Mega Event 3</div>
            <h4>Coming Soon !!</h4>
            <p>Stay tuned!</p>
            <div className="mega-card-date"></div>
            <div className="mega-card-badges">
              <span className="open-badge">Open to all departments</span>
            </div>
          </div>

        </ScrollReveal>
      </div>
    </section>
  );
}
