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
    <div
      aria-hidden="true"
      className={`hero-top-glow ${className}`.trim()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '85%',
        pointerEvents: 'none',
        zIndex: 1,
        ...style,
      }}
    >
      {/* Curved dark cyan/teal wash — organically spreads from top-center outward */}
      <motion.div
        initial={{
          opacity: prefersReducedMotion ? 1 : 0,
          scaleX: prefersReducedMotion ? 1 : 0.2,
          scaleY: prefersReducedMotion ? 1 : 0.4,
        }}
        animate={{
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
        }
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 0%',
          background:
            'radial-gradient(ellipse 60% 95% at 50% 0%, color-mix(in srgb, var(--cyan) 72%, transparent) 0%, color-mix(in srgb, var(--cyan) 34%, transparent) 45%, color-mix(in srgb, var(--cyan) 10%, transparent) 75%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Grain texture overlay — static 1:1 unscaled tiles, smooth opacity fade only */}
      <motion.div
        initial={{ opacity: prefersReducedMotion ? 0.08 : 0 }}
        animate={{ opacity: 0.08 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 1.5, ease: 'easeOut', delay: 0.2 }
        }
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
