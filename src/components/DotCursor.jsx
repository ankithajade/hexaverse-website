import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useSpotlight } from '../context/SpotlightContext';

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  '[role="button"]',
  '[role="link"]',
  'input',
  'select',
  'textarea',
  '.dept-card',
  '.mega-card',
  '.about-card',
  '.event-card',
  '.contact-link',
  '.back-to-top',
  '.btn-register',
  '.btn-details',
  '.btn-dept-register',
  '.btn-timeline-register',
  '.day-pill',
].join(', ');

const RESTING_SIZE = 12; // px diameter

/**
 * DotCursor — Minimal dot cursor component.
 * Follows mouse pointer with smooth spring physics.
 * Scales up (~2.8x) and softens opacity when hovering interactive elements.
 * Color comes from SpotlightContext (var(--cyan) by default, switching on dept card hover).
 * Hidden under prefers-reduced-motion.
 */
export default function DotCursor() {
  const { spotlightColor } = useSpotlight();

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
  );

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const updateMobile = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  const posX = useMotionValue(-100);
  const posY = useMotionValue(-100);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  const springX = useSpring(posX, { stiffness: 280, damping: 28, mass: 0.4 });
  const springY = useSpring(posY, { stiffness: 280, damping: 28, mass: 0.4 });
  const springScale = useSpring(scale, { stiffness: 280, damping: 28, mass: 0.4 });
  const springOpacity = useSpring(opacity, { stiffness: 280, damping: 28, mass: 0.4 });

  useEffect(() => {
    if (prefersReducedMotion || isMobile) return;

    const onMouseMove = (e) => {
      posX.set(e.clientX);
      posY.set(e.clientY);
      setIsVisible(true);

      const target = e.target.closest(INTERACTIVE_SELECTOR);
      if (target) {
        scale.set(2.8);
        opacity.set(0.65);
      } else {
        scale.set(1);
        opacity.set(1);
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [posX, posY, scale, opacity, prefersReducedMotion, isMobile]);

  if (prefersReducedMotion || isMobile) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: springX,
        top: springY,
        width: RESTING_SIZE,
        height: RESTING_SIZE,
        scale: springScale,
        opacity: isVisible ? springOpacity : 0,
        translateX: '-50%',
        translateY: '-50%',
        borderRadius: '50%',
        background: spotlightColor,
        boxShadow: `0 0 12px ${spotlightColor}`,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
      }}
    />
  );
}
