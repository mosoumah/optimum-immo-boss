import { useState, useCallback } from "react";
import { motion, useTransform, useSpring, useMotionValueEvent, MotionValue } from "framer-motion";

interface ScrollStatProps {
  scrollProgress: MotionValue<number>;
  prefix?: string;
  suffix?: string;
  values: number[];
  decimals?: number;
  formatNumber?: (n: number) => string;
  label: string;
  index: number;
}

const defaultFormatter = (decimals: number) => (n: number) => {
  const fixed = n.toFixed(decimals);
  return decimals > 0 ? fixed.replace(".", ",") : fixed;
};

export const ScrollStat = ({
  scrollProgress,
  prefix = "",
  suffix = "",
  values,
  decimals = 0,
  formatNumber,
  label,
  index,
}: ScrollStatProps) => {
  const formatter = useCallback(
    (n: number) => (formatNumber ? formatNumber(n) : defaultFormatter(decimals)(n)),
    [formatNumber, decimals]
  );

  const rawValue = useTransform(scrollProgress, [0, 0.33, 0.66, 1], values);
  const smoothValue = useSpring(rawValue, { stiffness: 90, damping: 25 });

  const [display, setDisplay] = useState(() => `${prefix}${formatter(values[0])}${suffix}`);

  useMotionValueEvent(smoothValue, "change", (latest) => {
    setDisplay(`${prefix}${formatter(latest)}${suffix}`);
  });

  // Vague de couleur : chaque stat passe au vert à un moment décalé, plusieurs fois
  const colorProgress = useTransform(scrollProgress, (v) => {
    const offset = index * 0.18;
    return Math.max(0, Math.min(1, v + offset));
  });

  const color = useTransform(colorProgress, [0, 0.15, 0.35, 0.55, 0.75, 1], [
    "hsl(var(--foreground))",
    "hsl(var(--primary))",
    "hsl(var(--foreground))",
    "hsl(var(--primary))",
    "hsl(var(--foreground))",
    "hsl(var(--foreground))",
  ]);

  const glow = useTransform(colorProgress, [0, 0.15, 0.35, 0.55, 0.75, 1], [
    "0 0 0px hsl(var(--primary) / 0)",
    "0 0 40px hsl(var(--primary) / 0.35)",
    "0 0 0px hsl(var(--primary) / 0)",
    "0 0 40px hsl(var(--primary) / 0.35)",
    "0 0 0px hsl(var(--primary) / 0)",
    "0 0 0px hsl(var(--primary) / 0)",
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="text-center md:text-left"
    >
      <motion.div
        className="font-display text-2xl sm:text-4xl md:text-6xl tracking-tight transition-colors break-words"
        style={{ color, textShadow: glow }}
      >
        {display}
      </motion.div>
      <div className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}
