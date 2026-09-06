import { useRef } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import CursorGrid from './CursorGrid';
import HexGridOverlay from './HexGridOverlay';

// Crimson colour for valedictory block
const VAL_CRIMSON = '#b8264f';

export default function Timeline() {
  const block0Ref = useRef(null);
  const block1Ref = useRef(null);
  const block2Ref = useRef(null);
  const block3Ref = useRef(null);
  const block4Ref = useRef(null);
  const block5Ref = useRef(null);
  const block6Ref = useRef(null);
  const block7Ref = useRef(null);
  const block8Ref = useRef(null);
  const block9Ref = useRef(null);

  return (
    <section className="section" id="timeline">
      <HexGridOverlay />
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
            ref={block0Ref}
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--aiml)', position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--aiml)" targetRef={block0Ref} />
            </div>
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
            ref={block1Ref}
            className="timeline-block timeline-block--mega"
            style={{ position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--mega-accent)" targetRef={block1Ref} />
            </div>
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
            ref={block2Ref}
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--aids)', position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--aids)" targetRef={block2Ref} />
            </div>
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 02</div>
                  <h3 className="timeline-dept">AI &amp; DS</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">5 &ndash; 7 Oct 2026</span>
                  <Link to="/departments/aids" className="btn-timeline-register">Register Now</Link>
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

          {/* Week 03 — CSE */}
          <div
            ref={block3Ref}
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--cse)', position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--cse)" targetRef={block3Ref} />
            </div>
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 03</div>
                  <h3 className="timeline-dept">CSE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">5 &ndash; 8 Oct 2026</span>
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
                  <span className="day-pill-date">8 Oct</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Week 04 — ISE */}
          <div
            ref={block5Ref}
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--ise)', position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--ise)" targetRef={block5Ref} />
            </div>
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 04</div>
                  <h3 className="timeline-dept">ISE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">22 &ndash; 24 Oct 2026</span>
                  <Link to="/departments/ise" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">22 Oct</span>
                  <span className="day-pill-label">1 Day Workshop</span>
                </div>                
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">24 Oct</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Week 05 — ECE */}
          <div
            ref={block6Ref}
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--ece)', position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--ece)" targetRef={block6Ref} />
            </div>
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 05</div>
                  <h3 className="timeline-dept">ECE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">22 &ndash; 29 Oct 2026</span>
                  <Link to="/departments/ece" className="btn-timeline-register">Register Now</Link>
                </div>
              </div>
              <div className="timeline-days">
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">22 Oct</span>
                  <span className="day-pill-label">Workshop Day 1</span>
                </div>
                <div className="day-pill day-pill--workshop">
                  <span className="day-pill-date">23 Oct</span>
                  <span className="day-pill-label">Workshop Day 2</span>
                </div>
                <div className="day-pill day-pill--event">
                  <span className="day-pill-date">29 Oct</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mega Event 2 — Hackathon */}
          <div
            ref={block7Ref}
            className="timeline-block timeline-block--mega"
            style={{ position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--mega-accent)" targetRef={block7Ref} />
            </div>
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
            ref={block8Ref}
            className="timeline-block timeline-block--dept"
            style={{ '--block-accent': 'var(--eee)', position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--eee)" targetRef={block8Ref} />
            </div>
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-week-badge">Week 06</div>
                  <h3 className="timeline-dept">EEE</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">2 &ndash; 5 Nov 2026</span>
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
                  <span className="day-pill-date">5 Nov</span>
                  <span className="day-pill-label">Dept. Signature Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mega Event 3 — Technical Talk */}
          <div
            ref={block4Ref}
            className="timeline-block timeline-block--mega"
            style={{ position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color="var(--mega-accent)" targetRef={block4Ref} />
            </div>
            <div className="timeline-block-inner">
              <div className="timeline-block-header">
                <div className="timeline-block-brand">
                  <div className="timeline-mega-badge">Mega Event</div>
                  <h3>Coming Soon !!</h3>
                </div>
                <div className="timeline-header-right">
                  <span className="timeline-dates">Stay tuned!</span>
                </div>
              </div>
              <span className="timeline-open-badge">Open to all departments</span>
            </div>
          </div>

          {/* Valedictory */}
          <div
            ref={block9Ref}
            className="timeline-block timeline-block--valedictory"
            style={{ position: 'relative' }}
          >
            <div className="timeline-block-clip">
              <CursorGrid color={VAL_CRIMSON} targetRef={block9Ref} />
            </div>
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
