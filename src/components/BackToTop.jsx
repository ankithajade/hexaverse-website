import { useEffect, useState } from 'react';

/**
 * Scroll-triggered "back to top" button.
 * Replaces the JS-generated back-to-top DOM element from script.js.
 * Appears when scrollY > 400px, scrolls to top smoothly on click.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      className={`back-to-top${visible ? ' visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
