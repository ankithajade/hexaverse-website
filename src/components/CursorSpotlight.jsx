import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useSpotlight } from '../context/SpotlightContext';

/**
 * CursorSpotlight — Motion Primitives "Spotlight Custom Color" pattern.
 * Follows the cursor with a spring-eased radial glow.
 * Color defaults to var(--cyan); changes to the hovered dept's color
 * when over a .dept-card (driven by SpotlightContext via DepartmentsGrid).
 * Hidden entirely under prefers-reduced-motion.
 */
export default function CursorSpotlight() {
  const { spotlightColor } = useSpotlight();

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mouseX = useMotionValue(-600);
  const mouseY = useMotionValue(-600);

  const springX = useSpring(mouseX, { stiffness: 160, damping: 22, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 160, damping: 22, mass: 0.5 });

  const isVisible = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const onMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      isVisible.current = true;
    };
    const onLeave = () => {
      mouseX.set(-600);
      mouseY.set(-600);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [mouseX, mouseY, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: springX,
        top: springY,
        width: 480,
        height: 480,
        translateX: '-50%',
        translateY: '-50%',
        background: `radial-gradient(circle, color-mix(in srgb, ${spotlightColor} 22%, transparent) 0%, transparent 68%)`,
        pointerEvents: 'none',
        zIndex: 9998,
        transition: 'background 0.35s ease',
      }}
    />
  );
}
