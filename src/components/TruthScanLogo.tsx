import { motion } from 'motion/react';

interface TruthScanLogoProps {
  size?: number;
  animated?: boolean;
}

export function TruthScanLogo({ size = 28, animated = true }: TruthScanLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <motion.path
        d="M18 3L31 8.5V17.5C31 25.2 25.4 31.6 18 33.5C10.6 31.6 5 25.2 5 17.5V8.5L18 3Z"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0.4, opacity: 0.6 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : false}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.circle
        cx="18"
        cy="17.5"
        r="5.5"
        stroke="#7C3AED"
        strokeWidth="1.8"
        initial={animated ? { scale: 0.8, opacity: 0.5 } : false}
        animate={animated ? { scale: 1, opacity: 1 } : false}
        transition={{ duration: 0.5, delay: 0.15 }}
      />
      <motion.path
        d="M15.4 17.6L17.3 19.5L21 15.6"
        stroke="#E8EDF7"
        className="stroke-slate-900 dark:stroke-[#E8EDF7]"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : false}
        animate={animated ? { pathLength: 1 } : false}
        transition={{ duration: 0.45, delay: 0.25 }}
      />
    </svg>
  );
}
