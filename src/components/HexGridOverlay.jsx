/**
 * HexGridOverlay — Absolutely-positioned hex grid pattern for individual sections.
 * Scrolls naturally with its parent section.
 * Tile size: 84 × 48.5, stroke: var(--cyan), opacity: 0.15
 */
export default function HexGridOverlay() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id="hex-section-pattern"
          x="0"
          y="0"
          width="84"
          height="48.5"
          patternUnits="userSpaceOnUse"
        >
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
      <rect width="100%" height="100%" fill="url(#hex-section-pattern)" />
    </svg>
  );
}
