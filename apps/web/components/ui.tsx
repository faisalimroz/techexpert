'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@te/ui';

/** Slides content in once; content is always visible at rest (no opacity:0 gating). */
export function Reveal({ children, className, delay = 0, as = 'div' }: { children: React.ReactNode; className?: string; delay?: number; as?: 'div' | 'li' }) {
  const reduce = useReducedMotion();
  const M = as === 'li' ? motion.li : motion.div;
  return (
    <M
      className={className}
      initial={reduce ? false : { y: 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </M>
  );
}

export function SectionHead({ eyebrow, title, lede, className, dark }: { eyebrow: string; title: React.ReactNode; lede?: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <Reveal className={cn('mb-12 max-w-[780px]', className)}>
      <p className={cn('eyebrow mb-4', dark && 'text-sun')}>{eyebrow}</p>
      <h2 className={cn('h-section', dark && '!text-white')}>{title}</h2>
      {lede && <p className={cn('lede mt-5', dark && '!text-white/70')}>{lede}</p>}
    </Reveal>
  );
}
