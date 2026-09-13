import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ScrollReveal from './ScrollReveal';
import HexGridOverlay from './HexGridOverlay';
import { departments, departmentsList } from '../data/departments';
import { useSpotlight } from '../context/SpotlightContext';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TAGLINES = {
  aiml: 'Explore AI, ML, and cloud technologies through hands-on experiences, practical problem-solving, and creative technical challenges.',
  aids: 'Dive into cloud and generative AI, unleash your creativity, and turn original ideas into something worth putting in the spotlight.',
  cse: 'Explore AWS, experiment with Amazon Q, sharpen your coding skills, and take on a simulated system compromise where teamwork and quick thinking lead to recovery.',
  ise: 'Discover Generative AI, RAG, and Amazon Bedrock while experimenting with intelligent solutions and tackling real-world challenges.',
  ece: 'Explore Electronics, intelligent systems, and real-world challenges - where circuits, AI, cloud, and creativity come together.',
  eee: 'Step into cloud technologies, tackle engineering challenges, and put your knowledge, creativity, and teamwork to the test.',
};

/**
 * DepartmentsGrid — Motion Primitives "Animated Card Background".
 * On hover each card's background smoothly transitions toward the dept accent
 * color at ~12% opacity via a motion.div overlay (variant propagation).
 * Also drives the global CursorSpotlight color via SpotlightContext.
 */
export default function DepartmentsGrid() {
  const navigate = useNavigate();
  const { setColor, resetColor } = useSpotlight();

  return (
    <section className="section" id="departments">
      <HexGridOverlay />
      <div className="container">
        <ScrollReveal>
          <div className="section-label">Explore</div>
          <h2 className="section-title">Explore by Department</h2>
          <p className="section-desc">
            Each department has its own week, identity, and dedicated events. Dive into any
            department to see what&apos;s in store.
          </p>
        </ScrollReveal>

        <ScrollReveal stagger className="dept-directory">
          {departmentsList.map((id) => {
            const dept = departments[id];
            return (
              <motion.div
                key={id}
                className="dept-card"
                role="link"
                tabIndex={0}
                style={{ '--card-accent': dept.cssVar, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                // Variant propagation: sets "hover" on the whole subtree
                initial="rest"
                whileHover="hover"
                onClick={() => navigate(`/departments/${id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/departments/${id}`)}
                onMouseEnter={() => { if (!prefersReducedMotion) setColor(dept.cssVar); }}
                onMouseLeave={() => resetColor()}
              >
                {/* Animated background wash — dept color at 12% opacity */}
                <motion.div
                  aria-hidden="true"
                  variants={
                    prefersReducedMotion
                      ? {}
                      : { rest: { opacity: 0 }, hover: { opacity: 1 } }
                  }
                  transition={{ duration: 0.28 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `color-mix(in srgb, ${dept.cssVar} 20%, var(--bg-card))`,
                    borderRadius: 'inherit',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />

                {/* Card content — z-index above the overlay */}
                <div className="dept-card-logo" style={{ '--logo-color': dept.cssVar, position: 'relative', zIndex: 1 }}>
                  <img
                    src={dept.logoSrc}
                    alt={`${dept.name} Logo`}
                    onError={(e) => { e.currentTarget.style.opacity = 0; }}
                  />
                </div>
                <div className="dept-card-info" style={{ position: 'relative', zIndex: 1 }}>
                  <h3>{dept.name}</h3>
                  <div className="dept-card-week">
                    {dept.week} &middot; {dept.displayDates}
                  </div>
                  <p>{TAGLINES[id]}</p>
                </div>
                <div className="dept-card-arrow" style={{ position: 'relative', zIndex: 1 }}>&rarr;</div>
              </motion.div>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
