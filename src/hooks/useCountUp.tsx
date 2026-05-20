import { useState, useEffect, useRef, useCallback } from "react";

interface UseCountUpOptions {
  duration?: number;
  startOnView?: boolean;
  threshold?: number;
}

export const useCountUp = (
  endValue: number,
  options: UseCountUpOptions = {}
) => {
  const { duration = 2000, startOnView = true, threshold = 0.2 } = options;
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Easing function - easeOutQuart for smooth deceleration
  const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

  useEffect(() => {
    if (!startOnView) {
      // Animate immediately if not waiting for view
      animateCount();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCount();
          }
        });
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [endValue, hasAnimated, startOnView, threshold, animateCount]);

  const animateCount = useCallback(() => {
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.floor(easedProgress * endValue);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(updateCount);
  }, [endValue, duration]);

  return { count, ref };
};

// Helper to parse value strings like "98%", "500+", "24/7"
export const parseStatValue = (value: string): { number: number; suffix: string } => {
  const match = value.match(/^(\d+)(.*)$/);
  if (match) {
    return {
      number: parseInt(match[1], 10),
      suffix: match[2] || "",
    };
  }
  return { number: 0, suffix: value };
};
