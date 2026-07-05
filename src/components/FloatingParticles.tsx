import { useEffect, useMemo, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  dx: number;
  dy: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

/**
 * Lightweight, GPU-friendly floating particles.
 * - Pure CSS keyframes (compositor-only transform/opacity), no per-frame JS.
 * - Reduced count and no boxShadow to avoid paint storms behind blurred cards.
 * - Automatically disables on small screens or when the user prefers reduced motion.
 */
export const FloatingParticles = ({ count = 20, className = "" }: FloatingParticlesProps) => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;
    setEnabled(!reduced && !small);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const effectiveCount = Math.min(count, 18);
    return Array.from({ length: effectiveCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1.5,
      duration: Math.random() * 12 + 14,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.25 + 0.15,
      dx: (Math.random() - 0.5) * 30,
      dy: -(Math.random() * 30 + 15),
    }));
  }, [count]);

  if (!enabled) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes lv-float {
          0%   { transform: translate3d(0, 0, 0) scale(1); opacity: var(--o); }
          50%  { transform: translate3d(var(--dx), var(--dy), 0) scale(1.1); opacity: calc(var(--o) * 1.6); }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: var(--o); }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: "hsl(72, 100%, 55%)",
            ["--o" as string]: String(p.opacity),
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            opacity: p.opacity,
            animation: `lv-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
};
