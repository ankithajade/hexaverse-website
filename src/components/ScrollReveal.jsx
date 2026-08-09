import { useScrollReveal } from '../hooks/useScrollReveal';

/**
 * ScrollReveal / ScrollFloat — React Bits "Scroll Float" entrance pattern.
 * Elements float upward (translateY 40px → 0) with an eased transition
 * and fade in as they scroll into the viewport, individually per element.
 *
 * Modes:
 *   <ScrollReveal>           — single element float reveal
 *   <ScrollReveal stagger>   — staggered children float reveal
 *
 * Respects prefers-reduced-motion: falls back to instant visibility
 * (elements simply present, no animation) via the CSS media query at
 * the bottom of styles.css.
 *
 * The CSS classes used here (.reveal, .stagger, .visible) are also
 * updated in styles.css to implement the Scroll Float motion
 * (translateY 40px → 0, spring-like cubic-bezier ease, 0.55s duration).
 */
export default function ScrollReveal({
  children,
  className = '',
  stagger = false,
  as: Tag = 'div',
  style,
  id,
}) {
  const [ref, visible] = useScrollReveal();
  const baseClass = stagger ? 'stagger' : 'reveal';
  const visClass = visible ? ' visible' : '';
  const combined = `${baseClass}${visClass}${className ? ' ' + className : ''}`;

  return (
    <Tag ref={ref} className={combined} style={style} id={id}>
      {children}
    </Tag>
  );
}
