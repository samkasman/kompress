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
    <div className={cn('p-4 flex flex-col h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-slate-100" />
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {headerAction}
          <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
      {children}
    </div>
  );
}
