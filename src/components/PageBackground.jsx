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

    </div>
  );
}
