import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'motion/react';

/**
 * AnimatedNumber — Motion Primitives "Animated Number" pattern.
 * Counts from 0 to `value` with a spring-ease when first scrolled into view.
 * Under prefers-reduced-motion: shows the final value immediately.
 *
 * Usage: <AnimatedNumber value={6} />
 * Renders a plain <span> with the current count inside.
 */
export default function AnimatedNumber({ value }) {
  const spanRef = useRef(null);
  const isInView = useInView(spanRef, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    // animate(from, to, options) — imperatively drives a numeric value
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
      onUpdate: (v) => setDisplay(Math.round(v)),
    });

    return () => controls.stop();
  }, [isInView, value]);

  return <span ref={spanRef}>{display}</span>;
}
