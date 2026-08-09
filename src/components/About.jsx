import { useState } from 'react';
import { motion } from 'motion/react';
import { FiTool } from 'react-icons/fi';
import { FaTrophy, FaHandshake } from 'react-icons/fa';
import { GiCampingTent } from 'react-icons/gi';
import ScrollReveal from './ScrollReveal';

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

// Dock magnify adjacency map for a 2×2 grid
const ADJACENT = { 0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2] };

/**
 * About — normal section in document flow (no scroll-linked entrance).
 * Apple-style Dock magnify hover on the 4 about-cards.
 * react-icons replacing emoji.
 */
export default function About() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  function getCardScale(i) {
    if (prefersReducedMotion || hoveredIdx === null) return 1;
    if (i === hoveredIdx) return 1.06;
    return ADJACENT[hoveredIdx]?.includes(i) ? 1.02 : 1;
  }

  return (
    <section
      className="section"
      id="about"
    >
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

        {/* Cards — Dock hover; whileInView entrance */}
        <div className="about-grid">
          {CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 22 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="about-card"
                animate={{
                  scale: getCardScale(i),
                  y: hoveredIdx === i && !prefersReducedMotion ? -8 : 0,
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                onHoverStart={() => !prefersReducedMotion && setHoveredIdx(i)}
                onHoverEnd={() => setHoveredIdx(null)}
              >
                <div className="about-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
