/**
 * PageBackground — Fixed, full-viewport, non-scrolling layer.
 * Replaces per-section backgrounds and body::before grid.
 *
 * Layers (bottom to top):
 *  1. var(--bg) base colour
 *  2. Soft radial gradient mesh using dept accent colours
 *  3. Repeating flat-top hexagon outline SVG pattern
 */
export default function PageBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Dept colour mesh — each dept at 12-16% opacity, transparent by 45% radius */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'radial-gradient(circle at 14% 14%, color-mix(in srgb, var(--aiml) 14%, transparent) 0%, transparent 44%)',
            'radial-gradient(circle at 86% 14%, color-mix(in srgb, var(--cse)  14%, transparent) 0%, transparent 44%)',
            'radial-gradient(circle at 86% 86%, color-mix(in srgb, var(--ise)  12%, transparent) 0%, transparent 42%)',
            'radial-gradient(circle at 14% 86%, color-mix(in srgb, var(--ece)  12%, transparent) 0%, transparent 42%)',
            'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--eee)  10%, transparent) 0%, transparent 38%)',
          ].join(', '),
        }}
      />

      {/* Flat-top hexagon outline grid
          Pattern tile: 84 × 48.5 (edge-length a = 28)
          5-segment path proven to tile into a seamless hex grid. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <pattern
            id="hex-bg-pattern"
            x="0"
            y="0"
            width="84"
            height="48.5"
            patternUnits="userSpaceOnUse"
          >
            {/*
              Segments derived from three flat-top hex centres in the tile:
                Left  (0, 24.25), Centre-top (42, 0), Centre-bottom (42, 48.5)
              Path: cap → diag-up → midline → diag-up → cap
                    then two diag-down legs + bottom caps
            */}
            <path
              d="M0,0 L14,0 L28,24.25 L56,24.25 L70,0 L84,0
                 M28,24.25 L14,48.5 L0,48.5
                 M56,24.25 L70,48.5 L84,48.5"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="0.65"
              opacity="0.15"
              strokeLinecap="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-bg-pattern)" />
      </svg>
    </div>
  );
}
