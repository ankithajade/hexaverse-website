import { useEffect, useState } from 'react';

/**
 * Returns true when window.scrollY > 60.
 * Mirrors the nav.classList.toggle('scrolled', scrollY > 60) logic from script.js.
 */
export function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Set initial state
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrolled;
}
