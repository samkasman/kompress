import { memo } from 'react';
import { ArrowDownToLine, Loader2 } from 'lucide-react';

type UpdaterStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string; notes?: string }
  | { phase: 'downloading'; progress: number }
  | { phase: 'installing' }
  | { phase: 'error'; message: string };

interface UpdateBadgeProps {
  status: UpdaterStatus;
  onInstall: () => void;
}

function UpdateBadge({ status, onInstall }: UpdateBadgeProps) {
  if (status.phase === 'idle' || status.phase === 'checking') return null;

  if (status.phase === 'available') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onInstall();
        }}
        title={`Install v${status.version}`}
        data-no-drag
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded border border-border-strong bg-surface-1 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground-muted transition-colors hover:bg-surface-2 hover:border-foreground-faint hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowDownToLine className="h-3 w-3" strokeWidth={1.5} />
        Update v{status.version}
      </button>
    );
  }

  if (status.phase === 'downloading') {
    return (
      <div className="pointer-events-none inline-flex items-center gap-1.5 rounded border border-border bg-surface-1 px-2 py-1 font-mono text-[10px] uppercase tracking-wider tabular-nums text-foreground-muted">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
        {status.progress}%
      </div>
    );
  }

  if (status.phase === 'installing') {
    return (
      <div className="pointer-events-none inline-flex items-center gap-1.5 rounded border border-border bg-surface-1 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
        Installing
      </div>
    );
  }

  // status.phase === 'error' — keep silent in the header; the console drawer
  // already logged the failure via useUpdater's addLog.
  return null;
}

export default memo(UpdateBadge);
