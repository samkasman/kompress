import { Image, Film, Music } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { type SupportedFileType, formatExtList } from '@/constants/formats';

const badgeVariants = cva(
  'flex items-center gap-1.5 px-3 py-1.5 border rounded-md',
  {
    variants: {
      type: {
        image: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        video: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
        audio: 'bg-green-500/10 border-green-500/20 text-green-300',
      },
    },
  }
);

const ICONS: Record<SupportedFileType, LucideIcon> = {
  image: Image,
  video: Film,
  audio: Music,
};

const ICON_COLORS: Record<SupportedFileType, string> = {
  image: 'text-blue-400',
  video: 'text-purple-400',
  audio: 'text-green-400',
};

export function FormatBadge({ type }: { type: SupportedFileType }) {
  const Icon = ICONS[type];
  return (
    <div className={cn(badgeVariants({ type }))}>
      <Icon className={cn('h-3.5 w-3.5', ICON_COLORS[type])} />
      <span className="text-[10px] font-medium">{formatExtList(type)}</span>
    </div>
  );
}
