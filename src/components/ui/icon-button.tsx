import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-colors pointer-events-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        toolbar: 'text-foreground-muted hover:text-foreground',
        ghost: 'text-foreground-subtle hover:text-foreground-muted',
        subtle: 'text-foreground-faint hover:text-foreground-muted',
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
