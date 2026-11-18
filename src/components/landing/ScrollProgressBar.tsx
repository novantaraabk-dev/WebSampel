'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[999] pointer-events-none select-none bg-black/10">
      <motion.div
        style={{ scaleX }}
        className="h-full w-full origin-left bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.8)]"
      />
    </div>
  );
}

export default ScrollProgressBar;
