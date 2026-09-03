import { motion } from 'motion/react';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const NOISE_DATA_URI =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNzUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgibm9pc2UpIi8+PC9zdmc+';

/**
 * HeroTopGlow — soft, grainy, curved light-wash anchored to the top of the hero section.
 * Fades downward with a dark cyan/teal color matching the site's accent.
 */
export default function HeroTopGlow({ className = '', style = {} }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`hero-top-glow ${className}`.trim()}
      initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 1.0, ease: 'easeOut', delay: 0.1 }
      }
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '52%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Curved dark cyan/teal wash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 65% 50% at 50% -15%, color-mix(in srgb, var(--cyan) 45%, transparent) 0%, color-mix(in srgb, var(--cyan) 20%, transparent) 40%, transparent 72%)',
          pointerEvents: 'none',
        }}
      />

      {/* Grain texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundRepeat: 'repeat',
          opacity: 0.08,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}
