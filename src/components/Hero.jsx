import { motion } from 'motion/react';
import AnimatedNumber from './AnimatedNumber';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Hero — static section in document flow (no sticky, no scroll morph).
 * Content floats in on initial load via CSS animation (fadeIn keyframe).
 * Two-tier heading: HexaVerse huge, CloudFest '26 proportional.
 * Item 5: AWS logo correctly loaded (aws-sbg-logo.svg).
 */
export default function Hero() {
  return (
    <section
      className="hero"
      id="hero"
    >
      {/* Item B: Local blue gradient layer sitting behind content */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--aiml) 20%, transparent), transparent 55%)',
            'radial-gradient(circle at 75% 70%, color-mix(in srgb, var(--cyan) 18%, transparent), transparent 50%)',
            'var(--bg)',
          ].join(', '),
        }}
      />

      {/* Brand lockups moved to true page edges */}
      <div className="hero-brand-lockups">
        <div className="brand-lockup brand-lockup--left">
          <img
            src="/assets/aws-black-sbg-logo.svg"
            alt="AWS Student Builder Group Logo"
            className="brand-lockup-logo"
          />
          <div className="brand-lockup-text">
            AWS<br />
            <span className="brand-lockup-sub">Student Builder Group, DBIT</span>
          </div>
        </div>
        <div className="brand-lockup brand-lockup--right">
          <img
            src="/assets/college-logo.svg"
            alt="DBIT Logo"
            className="brand-lockup-logo"
          />
        </div>
      </div>

      <div className="container">
        {/* Main heading + meta — float-in via CSS animations (see styles.css fadeIn) */}
        <div className="hero-layout">
          <div className="hero-content">
            <h3>
              {/* Two-line title with distinct font sizes */}
              <span className="hero-title-main">
                Hexa<span className="accent">Verse</span>
              </span>
              <span className="hero-title-sub" style={{ whiteSpace: 'nowrap' }}>
                CloudFest &apos;26
              </span>
            </h3>

            <p className="hero-tagline">
              A 6-week interdepartmental technical engagement series. Workshops,
              competitions, mega events, and one unified experience across every department.
            </p>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="hero-meta-label">Duration</span>
                <span className="hero-meta-value">
                  <AnimatedNumber value={6} /> Weeks
                </span>
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-label">Dates</span>
                <span className="hero-meta-value">21 Sept &ndash; 6 Nov 2026</span>
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-label">Departments</span>
                <span className="hero-meta-value">
                  <AnimatedNumber value={6} /> Featured
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
