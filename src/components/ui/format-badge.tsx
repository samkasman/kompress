import { Image, Film, Music } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type SupportedFileType, formatExtList } from '@/constants/formats';

const ICONS: Record<SupportedFileType, LucideIcon> = {
  image: Image,
  video: Film,
  audio: Music,
};

export function FormatBadge({ type }: { type: SupportedFileType }) {
  const Icon = ICONS[type];
  return (
    <div className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/40 px-2 py-1 rounded">
      <Icon className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
      <span className="text-[10px] uppercase tracking-wider text-zinc-400">
        {formatExtList(type)}
      </span>
    </div>
  );
}
