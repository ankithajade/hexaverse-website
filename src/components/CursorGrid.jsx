import { useRef, useCallback, useEffect } from 'react';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CELL_SIZE = 28;   // px — grid cell size
const FADE_MS   = 600;  // how long a lit cell takes to fade out

/**
 * CursorGrid — React Bits "Pixel Trail" pattern.
 * Overlays a grid of small cells inside a container. When the cursor moves
 * over the container, cells near the cursor light up in the card's accent
 * colour and fade out, creating a trailing glow effect.
 *
 * Props:
 *   color  — CSS colour string (e.g. 'var(--aiml)', '#c9a227')
 *
 * Usage:
 *   <div style={{ position: 'relative', overflow: 'hidden' }}>
 *     <CursorGrid color="var(--aiml)" />
 *     {/* card content *\/}
 *   </div>
 */
function resolveCssColor(colorStr) {
  if (!colorStr) return '#04788f';
  if (colorStr.startsWith('var(')) {
    const temp = document.createElement('div');
    temp.style.color = colorStr;
    document.body.appendChild(temp);
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    return computed || colorStr;
  }
  return colorStr;
}

export default function CursorGrid({ color = 'var(--cyan)', targetRef = null }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(new Map()); // key: "col,row" → expiry timestamp
  const rafRef    = useRef(null);
  const isHovered = useRef(false);
  const resolvedColorRef = useRef(color);

  useEffect(() => {
    resolvedColorRef.current = resolveCssColor(color);
  }, [color]);

  // Draw loop — only runs while card is hovered or cells are still fading
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const now = performance.now();
    const active = activeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let hasActive = false;
    for (const [key, expiry] of active.entries()) {
      const remaining = expiry - now;
      if (remaining <= 0) {
        active.delete(key);
        continue;
      }
      hasActive = true;
      const [col, row] = key.split(',').map(Number);
      const alpha = remaining / FADE_MS;

      ctx.fillStyle = resolvedColorRef.current;
      ctx.globalAlpha = alpha * 0.35; // max 35% opacity at peak
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }
    ctx.globalAlpha = 1;

    if (hasActive || isHovered.current) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [draw]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;
    const col = Math.floor(lx / CELL_SIZE);
    const row = Math.floor(ly / CELL_SIZE);
    const key = `${col},${row}`;
    // Light up this cell and its immediate neighbours
    const now = performance.now();
    const spread = [
      [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1],
    ];
    for (const [dc, dr] of spread) {
      const c = col + dc;
      const r = row + dr;
      if (c >= 0 && r >= 0) {
        activeRef.current.set(`${c},${r}`, now + FADE_MS);
      }
    }
    startLoop();
  }, [startLoop]);

  const handleMouseEnter = useCallback(() => {
    isHovered.current = true;
    startLoop();
  }, [startLoop]);

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false;
    // Loop continues until all cells fade out
  }, []);

  // Resize canvas to match container
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Register mouse events on target container (targetRef or parentElement)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const target = targetRef?.current || canvas.parentElement;
    if (!target) return;

    target.addEventListener('mousemove',  handleMouseMove);
    target.addEventListener('mouseenter', handleMouseEnter);
    target.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      target.removeEventListener('mousemove',  handleMouseMove);
      target.removeEventListener('mouseenter', handleMouseEnter);
      target.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetRef, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        0,
        borderRadius:  'inherit',
      }}
    />
  );
}
