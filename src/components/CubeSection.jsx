import ScrollReveal from './ScrollReveal';
import TextScramble from './TextScramble';
import AnimatedNumber from './AnimatedNumber';

/**
 * CubeSection — adds:
 *  6e. TextScramble on "Six sides. One story." heading
 *  6d. AnimatedNumber on the three cube-stat-num values (6, 6, 1)
 */
export default function CubeSection() {
  return (
    <section className="section cube-section" id="cube">
      <div className="container">
        <ScrollReveal>
          <div className="section-label" style={{ justifyContent: 'center' }}>The Concept</div>
          <h2 className="section-title">The Cube</h2>
        </ScrollReveal>

        <ScrollReveal className="cube-layout">
          {/* 3D Rotating Cube */}
          <div className="cube-visual">
            <div className="cube-scene">
              <div className="cube-3d">
                <div className="cube-face face-front">CSE<span>Side 03</span></div>
                <div className="cube-face face-back">ISE<span>Side 04</span></div>
                <div className="cube-face face-right">AI &amp; ML<span>Side 02</span></div>
                <div className="cube-face face-left">AI &amp; DS<span>Side 01</span></div>
                <div className="cube-face face-top">ECE<span>Side 05</span></div>
                <div className="cube-face face-bottom">EEE<span>Side 06</span></div>
              </div>
            </div>
          </div>

          {/* Story copy */}
          <div className="cube-story">
            {/* TextScramble triggers once on viewport entry */}
            <TextScramble as="h3">Six sides. One story.</TextScramble>

            <p>
              The cube is HexaVerse. Each face represents one department &mdash; a unique identity,
              colour, and contribution. Together, all six sides form one complete, unified experience.
            </p>
            <p>
              A physical cube installation will live on campus throughout the series &mdash; collecting
              signatures, photographs, doodles, QR codes, and memories from every participant.
            </p>

            <div className="cube-stats">
              <div>
                <div className="cube-stat-num">
                  <AnimatedNumber value={6} />
                </div>
                <div className="cube-stat-label">Departments</div>
              </div>
              <div>
                <div className="cube-stat-num">
                  <AnimatedNumber value={6} />
                </div>
                <div className="cube-stat-label">Identities</div>
              </div>
              <div>
                <div className="cube-stat-num">
                  <AnimatedNumber value={1} />
                </div>
                <div className="cube-stat-label">Experience</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
