import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useAnimationFrame } from 'motion/react';
import ScrollReveal from './ScrollReveal';
import HexGridOverlay from './HexGridOverlay';
import { GALLERY_IMAGES } from '../data/galleryImages';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * InfiniteSlider — Motion Primitives "Infinite Slider hover speed" pattern.
 * Scrolls children continuously; slows/pauses on hover.
 */
function InfiniteSlider({ speed = 50 }) {
  const trackRef = useRef(null);
  const firstSetRef = useRef(null);
  const x = useMotionValue(0);
  const isPaused = useRef(false);

  useAnimationFrame((_time, delta) => {
    if (prefersReducedMotion || isPaused.current) return;
    const track = trackRef.current;
    const firstSet = firstSetRef.current;
    if (!track || !firstSet) return;

    const setWidth = firstSet.getBoundingClientRect().width + 2;
    const next = x.get() - (delta / 1000) * speed;
    // Seamlessly loop: when we've scrolled exactly one set's width, reset to 0
    x.set(Math.abs(next) >= setWidth ? 0 : next);
  });

  const cellStyle = { width: '260px', flexShrink: 0 };

  // Two separate arrays with distinct keys to avoid React key collisions
  const setA = GALLERY_IMAGES.map((src, i) => (
    <Link key={`a-${i}`} to="/gallery" className="gallery-cell" style={cellStyle}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Link>
  ));
  const setB = GALLERY_IMAGES.map((src, i) => (
    <Link key={`b-${i}`} to="/gallery" className="gallery-cell" style={cellStyle}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Link>
  ));

  return (
    <div style={{ overflow: 'hidden' }}>
      <motion.div
        ref={trackRef}
        style={{ x, display: 'flex', gap: '2px', width: 'max-content' }}
        onHoverStart={() => { isPaused.current = true; }}
        onHoverEnd={() => { isPaused.current = false; }}
      >
        {/* First set — measured for reset point */}
        <div ref={firstSetRef} style={{ display: 'flex', gap: '2px' }}>
          {setA}
        </div>
        {/* Duplicate set — identical content, unique keys */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {setB}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Gallery section.
 * Under prefers-reduced-motion: static 4-cell grid (no animation).
 */
export default function Gallery() {
  const staticCells = GALLERY_IMAGES.map((src, i) => (
    <Link key={i} to="/gallery" className="gallery-cell" style={{ width: '260px', flexShrink: 0 }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Link>
  ));

  return (
    <section className="section" id="gallery">
      <HexGridOverlay />
      <div className="container">
        <ScrollReveal>
          <div className="section-label">Moments</div>
          <Link to="/gallery" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 className="section-title">Gallery</h2>
          </Link>
          <p className="section-desc">Highlights and moments from the series &mdash; coming soon.</p>
        </ScrollReveal>
      </div>

      {/* Full-width slider outside the container so it bleeds edge-to-edge */}
      <ScrollReveal style={{ marginTop: '48px' }}>
        {prefersReducedMotion ? (
          <div className="gallery-grid">
            {staticCells}
          </div>
        ) : (
          <InfiniteSlider speed={48} />
        )}
      </ScrollReveal>
    </section>
  );
}
