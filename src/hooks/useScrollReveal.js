import { useEffect, useRef, useState } from 'react';

/**
 * Mirrors the IntersectionObserver-based `.reveal` / `.stagger` scroll
 * animation from the original script.js.
 *
 * Returns [ref, isVisible].
 * Attach `ref` to the element you want observed.
 * Once visible, the observer disconnects (fire-once).
 */
export function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}
