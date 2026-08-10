import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiTool } from 'react-icons/fi';
import { FaTrophy, FaHandshake } from 'react-icons/fa';
import { GiCampingTent } from 'react-icons/gi';
import ScrollReveal from './ScrollReveal';
import HexGridOverlay from './HexGridOverlay';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CARDS = [
  {
    icon: <FiTool />,
    title: 'Hands-on Workshops',
    desc: 'Two-day technical workshops each week, designed for the featured department\u2019s domain.',
  },
  {
    icon: <FaTrophy />,
    title: 'Department Events',
    desc: 'Signature competitions and activities curated for each department\u2019s strengths.',
  },
  {
    icon: <GiCampingTent />,
    title: 'Mega Events',
    desc: 'Large-scale events every two weeks \u2014 open to all departments, no boundaries.',
  },
  {
    icon: <FaHandshake />,
    title: 'Cross-Department',
    desc: 'Breaking silos. Building a unified campus-wide technical culture together.',
  },
];

/**
 * About — normal section in document flow.
 * AnimatedBackground sliding highlight hover on the 4 about-cards.
 */
export default function About() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <section
      className="section"
      id="about"
    >
      <HexGridOverlay />
      <div className="container">
        <ScrollReveal>
          <div className="section-label">What is HexaVerse</div>
          <h2 className="section-title">
            Six departments.<br />Six weeks. One experience.
          </h2>
          <p className="section-desc">
            Each week spotlights a different department at Don Bosco Institute of Technology (DBIT),
            featuring tailored workshops, signature events, and cross-campus mega events that bring
            every branch together.
          </p>
        </ScrollReveal>

        {/* Cards — AnimatedBackground sliding highlight; whileInView entrance */}
        <div
          className="about-grid"
          onMouseLeave={() => setHoveredId(null)}
        >
          {CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 22 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => !prefersReducedMotion && setHoveredId(i)}
              style={{ position: 'relative' }}
            >
              <div className="about-card" style={{ position: 'relative' }}>
                <AnimatePresence>
                  {hoveredId === i && (
                    <motion.div
                      layoutId="about-card-highlight"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: 'color-mix(in srgb, var(--cyan) 10%, var(--bg-card))',
                        border: '1px solid color-mix(in srgb, var(--cyan) 32%, transparent)',
                        zIndex: 0,
                      }}
                    />
                  )}
                </AnimatePresence>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="about-icon">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
