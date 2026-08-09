import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&?!0123456789';

/**
 * TextScramble — Motion Primitives "Text Scramble Basic" pattern.
 * Characters scramble through random chars before settling into final text.
 * Triggered once when the element enters the viewport.
 * Under prefers-reduced-motion: renders final text immediately.
 *
 * Usage: <TextScramble as="h3">Six sides. One story.</TextScramble>
 */
export default function TextScramble({ children, as: Tag = 'span', className, style }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [output, setOutput] = useState(children);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return; // already showing final text

    const target = children;
    let frame = 0;
    const FRAMES = 22; // how many iterations before fully settled

    const id = setInterval(() => {
      frame++;
      const progress = frame / FRAMES;
      const revealCount = Math.floor(target.length * progress);

      const next = target
        .split('')
        .map((char, i) => {
          if (char === ' ' || char === '.') return char; // preserve spaces & punctuation
          if (i < revealCount) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');

      setOutput(next);

      if (frame >= FRAMES) {
        setOutput(target);
        clearInterval(id);
      }
    }, 38);

    return () => clearInterval(id);
  }, [isInView, children]);

  return (
    <Tag ref={ref} className={className} style={style}>
      {output}
    </Tag>
  );
}
