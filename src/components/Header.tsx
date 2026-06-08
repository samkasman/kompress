import { memo, type ReactNode } from 'react';
import { Settings, Terminal } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

interface HeaderProps {
  showSK: boolean;
  onSettingsClick: () => void;
  onConsoleClick: () => void;
  /** Optional slot rendered to the left of the toolbar icons (e.g. update badge). */
  toolbarSlot?: ReactNode;
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '';

function Header({
  showSK,
  onSettingsClick,
  onConsoleClick,
  toolbarSlot,
}: HeaderProps) {
  return (
    <div className="relative flex-shrink-0 pointer-events-none z-20 border-b border-zinc-900">
      <div className="flex items-baseline justify-between px-4 py-2.5">
        <div
          className={`flex items-baseline gap-1.5 transition-opacity duration-500 ${
            showSK ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h1 className="font-mono text-[13px] text-zinc-100 leading-none tracking-tight">
            kompress
          </h1>
          {APP_VERSION && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 leading-none">
              v{APP_VERSION}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {toolbarSlot}
          <IconButton
            aria-label="Toggle console"
            onClick={(e) => {
              e.stopPropagation();
              onConsoleClick();
            }}
          >
            <Terminal className="h-4 w-4" strokeWidth={1.5} />
          </IconButton>
          <IconButton
            aria-label="Toggle settings"
            onClick={(e) => {
              e.stopPropagation();
              onSettingsClick();
            }}
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export default memo(Header);
