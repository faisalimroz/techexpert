/**
 * Shared, framework-light UI primitives (shadcn/ui conventions: cva variants + cn()).
 * App-specific components live in apps/web/components; promote here once reused by
 * the admin dashboard or a future customer portal.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        sun: 'bg-sun text-tech shadow-glow hover:-translate-y-0.5 hover:shadow-glow-lg',
        green: 'bg-nature text-white hover:bg-forest',
        outline: 'border border-forest/20 text-forest hover:border-nature hover:text-nature dark:border-white/20 dark:text-white',
        glass: 'border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20',
        ghost: 'text-forest hover:bg-forest/5 dark:text-white dark:hover:bg-white/10',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-[15px]',
        lg: 'h-14 px-8 text-base',
      },
    },
    defaultVariants: { variant: 'sun', size: 'md' },
  },
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;
