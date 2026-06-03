import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-colors pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        toolbar: 'text-slate-100 hover:text-slate-300',
        ghost: 'text-slate-400 hover:text-slate-200',
        subtle: 'text-slate-500 hover:text-slate-300',
      },
      size: {
        sm: 'p-1',
        md: 'p-2',
      },
    },
    defaultVariants: { variant: 'toolbar', size: 'md' },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
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
