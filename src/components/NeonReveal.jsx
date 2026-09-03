import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Custom NeonReveal component (React Bits Pro equivalent).
 * Renders a glowing neon bar that sweeps/reveals across its container.
 *
 * Props:
 *  - revealDelay (number, default 0) ms
 *  - revealDuration (number, default 2000) ms
 *  - verticalOffset (number, default 0.7) 0.0 to 1.0
 *  - direction ("horizontal" | "vertical", default "horizontal")
 *  - color (number, default 200) HSL hue (0-360)
 *  - barWidth (number, default 1.0) fraction of length
 *  - barHeight (number, default 0.02) fraction of cross size
 *  - mirrored (boolean, default false)
 *  - expandFrom ("center" | "left" | "right", default "center")
 *  - animateOnScroll (boolean, default false)
 *  - scrollThreshold (number, default 0.3)
 *  - intensity (number, default 1.0)
 *  - glowSpread (number, default 1.0)
 *  - followCursor (boolean, default false)
 *  - onStart (function)
 *  - onComplete (function)
 *  - className (string)
 *  - children (ReactNode)
 */
export default function NeonReveal({
  revealDelay = 0,
  revealDuration = 2000,
  verticalOffset = 0.7,
  direction = 'horizontal',
  color = 200,
  barWidth = 1.0,
  barHeight = 0.02,
  mirrored = false,
  expandFrom = 'center',
  animateOnScroll = false,
  scrollThreshold = 0.3,
  intensity = 1.0,
  glowSpread = 1.0,
  followCursor = false,
  onStart,
  onComplete,
  className = '',
  children,
  style = {},
}) {
  const containerRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(prefersReducedMotion);

  // Smooth offset for cursor tracking
  const rawOffset = useMotionValue(verticalOffset);
  const smoothOffset = useSpring(rawOffset, { stiffness: 120, damping: 20 });

  useEffect(() => {
    rawOffset.set(verticalOffset);
  }, [verticalOffset, rawOffset]);

  // Cursor tracking listener
  useEffect(() => {
    if (!followCursor || prefersReducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (rect.height === 0 || rect.width === 0) return;

      const norm =
        direction === 'horizontal'
          ? (e.clientY - rect.top) / rect.height
          : (e.clientX - rect.left) / rect.width;

      const clamped = Math.max(0, Math.min(1, norm));
      rawOffset.set(clamped);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [followCursor, direction, rawOffset]);

  // Animation trigger logic
  useEffect(() => {
    if (prefersReducedMotion) {
      if (onStart) onStart();
      if (onComplete) onComplete();
      return;
    }

    let delayTimer = null;
    let completeTimer = null;

    const startAnimation = () => {
      delayTimer = setTimeout(() => {
        setIsRevealed(true);
        if (onStart) onStart();

        completeTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, revealDuration);
      }, revealDelay);
    };

    if (animateOnScroll) {
      const container = containerRef.current;
      if (!container) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        },
        { threshold: scrollThreshold }
      );

      observer.observe(container);
      return () => {
        observer.disconnect();
        clearTimeout(delayTimer);
        clearTimeout(completeTimer);
      };
    } else {
      startAnimation();
      return () => {
        clearTimeout(delayTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [
    animateOnScroll,
    scrollThreshold,
    revealDelay,
    revealDuration,
    onStart,
    onComplete,
  ]);

  // Origin calculation based on expandFrom and direction
  const getTransformOrigin = () => {
    if (direction === 'horizontal') {
      if (expandFrom === 'left') return 'left center';
      if (expandFrom === 'right') return 'right center';
      return 'center center';
    } else {
      if (expandFrom === 'left') return 'center top';
      if (expandFrom === 'right') return 'center bottom';
      return 'center center';
    }
  };

  // Realistic Neon Tube Box-Shadow Layers
  const coreGlow = `0 0 ${Math.max(2, 4 * glowSpread)}px ${Math.max(1, 1 * glowSpread)}px hsl(${color} 100% 88% / ${Math.min(1, 0.95 * intensity)})`;
  const innerGlow = `0 0 ${12 * glowSpread}px ${2 * glowSpread}px hsl(${color} 100% 65% / ${Math.min(1, 0.85 * intensity)})`;
  const midGlow = `0 0 ${26 * glowSpread}px ${6 * glowSpread}px hsl(${color} 100% 52% / ${Math.min(1, 0.65 * intensity)})`;
  const outerGlow = `0 0 ${55 * glowSpread}px ${14 * glowSpread}px hsl(${color} 90% 45% / ${Math.min(1, 0.45 * intensity)})`;
  const haloGlow = `0 0 ${95 * glowSpread}px ${24 * glowSpread}px hsl(${color} 85% 40% / ${Math.min(1, 0.25 * intensity)})`;

  const neonStyle = {
    position: 'absolute',
    borderRadius: '9999px',
    background: '#ffffff',
    boxShadow: `${coreGlow}, ${innerGlow}, ${midGlow}, ${outerGlow}, ${haloGlow}`,
    transformOrigin: getTransformOrigin(),
    pointerEvents: 'none',
    zIndex: 1,
  };

  // Helper to render a single bar
  const renderBar = (offsetValue, key) => {
    const isHoriz = direction === 'horizontal';

    const barCss = isHoriz
      ? {
          ...neonStyle,
          left: `${(1 - barWidth) * 50}%`,
          width: `${barWidth * 100}%`,
          height: `${Math.max(2, barHeight * 100)}%`,
          top: `calc(${offsetValue * 100}% - ${(barHeight * 100) / 2}%)`,
        }
      : {
          ...neonStyle,
          top: `${(1 - barWidth) * 50}%`,
          height: `${barWidth * 100}%`,
          width: `${Math.max(2, barHeight * 100)}%`,
          left: `calc(${offsetValue * 100}% - ${(barHeight * 100) / 2}%)`,
        };

    const initialProp = isHoriz ? { scaleX: 0, scaleY: 1 } : { scaleX: 1, scaleY: 0 };
    const animateProp = isHoriz
      ? { scaleX: isRevealed ? 1 : 0, scaleY: 1 }
      : { scaleX: 1, scaleY: isRevealed ? 1 : 0 };

    return (
      <motion.div
        key={key}
        style={barCss}
        initial={initialProp}
        animate={animateProp}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: revealDuration / 1000, ease: [0.16, 1, 0.3, 1] }
        }
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={`neon-reveal-container ${className}`.trim()}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      {children}

      {/* Primary Bar */}
      {followCursor ? (
        <MotionBarConsumer
          smoothOffset={smoothOffset}
          renderBar={renderBar}
          barKey="primary"
        />
      ) : (
        renderBar(verticalOffset, 'primary')
      )}

      {/* Mirrored Bar */}
      {mirrored &&
        (followCursor ? (
          <MotionBarConsumer
            smoothOffset={smoothOffset}
            renderBar={renderBar}
            isMirrored
            barKey="mirrored"
          />
        ) : (
          renderBar(1 - verticalOffset, 'mirrored')
        ))}
    </div>
  );
}

// Consumer component to bind motionValue smoothOffset into style for followCursor
function MotionBarConsumer({ smoothOffset, renderBar, isMirrored = false, barKey }) {
  const [val, setVal] = useState(smoothOffset.get());

  useEffect(() => {
    const unsub = smoothOffset.on('change', (v) => {
      setVal(isMirrored ? 1 - v : v);
    });
    return () => unsub();
  }, [smoothOffset, isMirrored]);

  return renderBar(val, barKey);
}
