import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-colors pointer-events-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        toolbar: 'text-zinc-300 hover:text-zinc-50',
        ghost: 'text-zinc-500 hover:text-zinc-200',
        subtle: 'text-zinc-600 hover:text-zinc-300',
      },
      size: {
        sm: 'p-1',
        md: 'p-1.5',
      },
    },
    defaultVariants: { variant: 'toolbar', size: 'md' },
  }
);

export interface IconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      data-no-drag
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
IconButton.displayName = 'IconButton';
