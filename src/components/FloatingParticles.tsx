import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export const FloatingParticles = ({ count = 30, className = "" }: FloatingParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generatedParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      generatedParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }
    setParticles(generatedParticles);
  }, [count]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: `hsl(72, 100%, 50%)`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px hsl(72, 100%, 50%, 0.5)`,
          }}
          animate={{
            y: [0, -10, 0, 8, 0],
            x: [0, 5, -3, 2, 0],
            scale: [1, 1.05, 0.98, 1.02, 1],
            opacity: [particle.opacity, particle.opacity * 1.2, particle.opacity * 0.9, particle.opacity * 1.1, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Larger glowing orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${15 + i * 18}%`,
            width: 60 + i * 15,
            height: 60 + i * 15,
            background: `radial-gradient(circle, hsl(72, 100%, 50%, 0.04) 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -15, 0],
            x: [0, 8, 0],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 20 + i * 3,
            delay: i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
