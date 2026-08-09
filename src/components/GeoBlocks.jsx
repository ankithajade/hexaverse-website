/**
 * Renders the decorative geometric rectangles in the hero section.
 * Replaces the JS-generated .geo-block elements from script.js.
 * Colors, positions, and staggered fadeIn animation are preserved.
 */
export default function GeoBlocks() {
  const colors = [
    'rgba(4,120,143,0.18)',
    'rgba(4,120,143,0.10)',
    'rgba(4,120,143,0.06)',
    'rgba(184,90,0,0.12)',
  ];

  const rects = [
    { x: '58%', y: '12%', w: 64, h: 64 },
    { x: '72%', y: '8%', w: 48, h: 96 },
    { x: '80%', y: '30%', w: 96, h: 48 },
    { x: '65%', y: '55%', w: 80, h: 80 },
    { x: '88%', y: '18%', w: 40, h: 120 },
    { x: '50%', y: '70%', w: 56, h: 56 },
    { x: '90%', y: '60%', w: 72, h: 40 },
    { x: '75%', y: '78%', w: 48, h: 64 },
  ];

  return (
    <div className="geo-blocks">
      {rects.map((r, i) => (
        <div
          key={i}
          className="geo-block"
          style={{
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            background: colors[i % colors.length],
            opacity: 0,
            animation: `fadeIn 0.8s ${0.1 + i * 0.08}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
