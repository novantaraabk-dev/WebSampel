'use client';

import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

interface ScrollRevealSectionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  scaleInitial?: number;
  className?: string;
  showDivider?: boolean;
}

export const luxuryEasing = [0.22, 1, 0.36, 1] as const;

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 35, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: luxuryEasing,
    },
  },
};

export function ScrollRevealSection({
  children,
  delay = 0,
  duration = 0.85,
  yOffset = 55,
  scaleInitial = 0.97,
  className = '',
  showDivider = false,
  ...props
}: ScrollRevealSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: scaleInitial }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12, margin: '-40px' }}
      transition={{
        duration,
        delay,
        ease: luxuryEasing,
      }}
      className={`relative w-full ${className}`}
      {...props}
    >
      {showDivider && (
        <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="h-[1px] w-full max-w-6xl bg-gradient-to-r from-transparent via-teal-500/25 dark:via-teal-400/30 to-transparent" />
        </div>
      )}
      {children}
    </motion.div>
  );
}

export default ScrollRevealSection;
