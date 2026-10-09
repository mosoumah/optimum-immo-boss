import { motion } from "framer-motion";
import { useCountUp, parseStatValue } from "@/hooks/useCountUp";

interface StatCardProps {
  value: string;
  label: string;
  index: number;
}

export const StatCard = ({ value, label, index }: StatCardProps) => {
  const { number, suffix } = parseStatValue(value);
  const { count, ref } = useCountUp(number, { duration: 2000, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="card-glow rounded-2xl p-6 text-center group"
    >
      <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
        {count}{suffix}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </motion.div>
  );
};
