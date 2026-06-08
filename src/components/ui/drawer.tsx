import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from './icon-button';
import { cn } from '@/lib/utils';

interface DrawerProps {
  icon: LucideIcon;
  title: string;
  onClose: () => void;
  /** Optional action button rendered to the left of the close button. */
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Drawer({
  icon: Icon,
  title,
  onClose,
  headerAction,
  children,
  className,
}: DrawerProps) {
  return (
    <div className={cn('flex flex-col h-full bg-zinc-950', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
          <h2 className="text-xs uppercase tracking-[0.18em] text-zinc-300">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {headerAction}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
        {children}
      </div>
    </div>
  );
}
