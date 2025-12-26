import { motion } from "framer-motion";
import logoIcon from "@/assets/logo-icon.jpg";

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

  return (
    <div className="flex items-center gap-3">
      <motion.div 
        className={`${sizeClasses[size]} relative`}
        initial={animated ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 200,
        }}
      >
        <img 
          src={logoIcon} 
          alt="Optimum Immo" 
          className="w-full h-full object-contain rounded"
        />
      </motion.div>
      <span className={`${textSizes[size]} font-bold text-foreground tracking-tight`}>
        optimum <span className="text-primary">immo</span>
      </span>
    </div>
  );
};
