import ScrollReveal from './ScrollReveal';
import TextScramble from './TextScramble';
import AnimatedNumber from './AnimatedNumber';
import HexGridOverlay from './HexGridOverlay';
import { departments } from '../data/departments';

/**
 * CubeSection — adds:
 *  6e. TextScramble on "Six sides. One story." heading
 *  6d. AnimatedNumber on the three cube-stat-num values (6, 6, 1)
 */
export default function CubeSection() {
  return (
    <section className="section cube-section" id="cube">
      <HexGridOverlay />
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
                <div className="cube-face face-front">
                  <img src={departments.cse.logoSrc} alt="" className="cube-face-logo-img" aria-hidden="true" />
                  <span className="cube-face-name">{departments.cse.name}</span>
                </div>
                <div className="cube-face face-back">
                  <img src={departments.ise.logoSrc} alt="" className="cube-face-logo-img" aria-hidden="true" />
                  <span className="cube-face-name">{departments.ise.name}</span>
                </div>
                <div className="cube-face face-right">
                  <img src={departments.aiml.logoSrc} alt="" className="cube-face-logo-img" aria-hidden="true" />
                  <span className="cube-face-name">{departments.aiml.name}</span>
                </div>
                <div className="cube-face face-left">
                  <img src={departments.aids.logoSrc} alt="" className="cube-face-logo-img" aria-hidden="true" />
                  <span className="cube-face-name">{departments.aids.name}</span>
                </div>
                <div className="cube-face face-top">
                  <img src={departments.ece.logoSrc} alt="" className="cube-face-logo-img" aria-hidden="true" />
                  <span className="cube-face-name">{departments.ece.name}</span>
                </div>
                <div className="cube-face face-bottom">
                  <img src={departments.eee.logoSrc} alt="" className="cube-face-logo-img" aria-hidden="true" />
                  <span className="cube-face-name">{departments.eee.name}</span>
                </div>
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
              A physical cube installation will live on campus throughout the series - becoming a visual landmark for HexaVerse. 
              Capture your moments with it, tag us @awssbg_dbit, and be part of the story!
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
