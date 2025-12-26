import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const Logo = ({ size = "md", animated = true }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  // Grid pattern matching the brand reference - 4x4 grid with specific dots
  const dotPositions = [
    // Row 1
    { row: 0, col: 1 }, { row: 0, col: 2 },
    // Row 2
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
    // Row 3
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
    // Row 4
    { row: 3, col: 1 }, { row: 3, col: 2 },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {dotPositions.map((pos, i) => (
            <motion.circle
              key={i}
              cx={5 + pos.col * 10}
              cy={5 + pos.row * 10}
              r="4"
              fill="hsl(var(--primary))"
              initial={animated ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: animated ? i * 0.04 : 0,
                duration: 0.3,
                type: "spring",
                stiffness: 200,
              }}
            />
          ))}
        </svg>
      </div>
      <span className={`${textSizes[size]} font-bold text-foreground tracking-tight`}>
        optimum <span className="text-primary">immo</span>
      </span>
    </div>
  );
};
