import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { useNavScroll } from '../hooks/useNavScroll';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const NAV_LINKS = [
  { to: '/#about',       label: 'About' },
  { to: '/#timeline',    label: 'Timeline' },
  { to: '/#events',      label: 'Events' },
  { to: '/#cube',        label: 'The Cube' },
  { to: '/#departments', label: 'Departments' },
  { to: '/#contact',     label: 'Contact' },
];

/**
 * Nav enhancements:
 *  - Animated Tabs Hover — sliding pill (layoutId) following hovered link.
 *  - Scroll Progress Fill — a full-height gradient overlay inside the nav
 *    that fills left-to-right as the user scrolls. Replaces the old 2px line.
 *  - Brand link always scrolls to #hero (item 4).
 */
export default function Nav() {
  const scrolled = useNavScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  const { scrollYProgress } = useScroll();

  const closeMenu = () => setMenuOpen(false);

  // Brand link: navigate to /#hero AND always scrollIntoView smoothly
  const handleBrandClick = () => {
    closeMenu();
    setTimeout(() => {
      document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <nav
      className={`nav${scrolled ? ' scrolled' : ''}`}
      id="nav"
      style={{ position: 'fixed' }}
    >
      {/* ── Scroll progress fill — full-height gradient behind nav content ── */}
      <motion.div
        aria-hidden="true"
        style={{
          scaleX: prefersReducedMotion ? 0 : scrollYProgress,
          transformOrigin: 'left',
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in srgb, var(--aiml) 35%, transparent)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="nav-inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* Brand — always navigates to /#hero */}
        <NavLink to="/#hero" className="nav-brand" onClick={handleBrandClick}>
          <span className="nav-logo-text">HexaVerse &apos;26</span>
        </NavLink>

        {/* Links with sliding hover pill */}
        <div
          className={`nav-links${menuOpen ? ' open' : ''}`}
          id="navLinks"
          onMouseLeave={() => setHoveredLink(null)}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenu}
              onMouseEnter={() => setHoveredLink(to)}
              style={{ position: 'relative' }}
            >
              {/* Pill — uses layoutId so it slides between links */}
              <AnimatePresence>
                {hoveredLink === to && !prefersReducedMotion && (
                  <motion.span
                    key="nav-pill"
                    layoutId="nav-pill"
                    className="nav-hover-pill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* Right: AWS SBG logo + hamburger */}
        <div className="nav-right">
          <img
            src="/assets/aws-sbg-logo.svg"
            alt="AWS SBG"
            className="nav-sbg-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            id="hamburger"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
