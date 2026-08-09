import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import CursorGrid from './CursorGrid';

// Gold colour for valedictory block (item 10)
const VAL_GOLD = '#c9a227';

export default function Timeline() {
  return (
    <section className="section" id="timeline">
      <div className="container">
        <ScrollReveal>
          <div className="section-label">6-Week Roadmap</div>
          <h2 className="section-title">The Series Timeline</h2>
          <p className="section-desc">
            Every workshop, signature event, and mega event &mdash; mapped out week by week.
          </p>
        </ScrollReveal>

        <ScrollReveal stagger className="timeline">

          {/* Week 01 — AI & ML */}
          <div
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--aiml)', position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--aiml)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 01</div>
                  <h3 className="timeline-dept">AI &amp; ML</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">21 &ndash; 23 Sept 2026</span>
                  <Link to="/departments/aiml" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--ceremony">
                  <span className="day-pill-date">21 Sept</span>
                  <span className="day-pill-label">Opening Ceremony + Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">22 Sept</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">23 Sept</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mega Event 1 — Treasure Hunt */}
          <div
            className="timeline-block timeline-block--mega"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--mega-accent)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-mega-badge">Mega Event</div>
                  <h3>Treasure Hunt</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">25 Sept 2026</span>
                  <a href="#events" className="btn-timeline-register btn-timeline-mega">Click Here</a>
                </div>
              </div>
              <span className="timeline-open-badge">Open to all departments</span>
            </div>
          </div>

          {/* Week 02 — AI & DS */}
          <div
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--aids)', position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--aids)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 02</div>
                  <h3 className="timeline-dept">AI &amp; DS</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">28 &ndash; 30 Sept 2026</span>
                  <Link to="/departments/aids" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">28 Sept</span>
                  <span className="day-pill-label">Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">29 Sept</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">30 Sept</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Week 03 — CSE */}
          <div
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--cse)', position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--cse)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 03</div>
                  <h3 className="timeline-dept">CSE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">5 &ndash; 7 Oct 2026</span>
                  <Link to="/departments/cse" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">5 Oct</span>
                  <span className="day-pill-label">Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">6 Oct</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">7 Oct</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mega Event 2 — Technical Talk */}
          <div
            className="timeline-block timeline-block--mega"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--mega-accent)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-mega-badge">Mega Event</div>
                  <h3>Technical Talk</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">9 Oct 2026</span>
                  <a href="#events" className="btn-timeline-register btn-timeline-mega">Click Here</a>
                </div>
              </div>
              <span className="timeline-open-badge">Open to all departments</span>
            </div>
          </div>

          {/* Week 04 — ISE */}
          <div
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--ise)', position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--ise)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 04</div>
                  <h3 className="timeline-dept">ISE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">12 &ndash; 14 Oct 2026</span>
                  <Link to="/departments/ise" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">12 Oct</span>
                  <span className="day-pill-label">Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">13 Oct</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">14 Oct</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Week 05 — ECE */}
          <div
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--ece)', position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--ece)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 05</div>
                  <h3 className="timeline-dept">ECE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">26 &ndash; 28 Oct 2026</span>
                  <Link to="/departments/ece" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">26 Oct</span>
                  <span className="day-pill-label">Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">27 Oct</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">28 Oct</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mega Event 3 — Hackathon */}
          <div
            className="timeline-block timeline-block--mega"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--mega-accent)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-mega-badge">Mega Event</div>
                  <h3>Hackathon</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">30 &ndash; 31 Oct 2026</span>
                  <a href="#events" className="btn-timeline-register btn-timeline-mega">Click Here</a>
                </div>
              </div>
              <span className="timeline-open-badge">Open to all departments</span>
              <span className="timeline-inter-badge">Inter-College</span>
            </div>
          </div>

          {/* Week 06 — EEE */}
          <div
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--eee)', position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color="var(--eee)" />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 06</div>
                  <h3 className="timeline-dept">EEE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">2 &ndash; 4 Nov 2026</span>
                  <Link to="/departments/eee" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">2 Nov</span>
                  <span className="day-pill-label">Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">3 Nov</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">4 Nov</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Valedictory */}
          <div
            className="timeline-block timeline-block--valedictory"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <CursorGrid color={VAL_GOLD} />
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-val-badge">Valedictory</div>
                  <h3>Closing Ceremony</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">6 Nov 2026</span>
                </div>
              </div>
            </div>
          </div>

        </ScrollReveal>
      </div>
    </section>
  );
}
