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
        title={`Install kompress v${status.version}`}
        data-no-drag
        className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-blue-400/40 bg-blue-500/15 px-2 py-1 text-[11px] font-medium text-blue-200 transition-colors hover:bg-blue-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <ArrowDownToLine className="h-3 w-3" />
        Update to v{status.version}
      </button>
    );
  }

  if (status.phase === 'downloading') {
    return (
      <div className="pointer-events-none inline-flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        {status.progress}%
      </div>
    );
  }

  if (status.phase === 'installing') {
    return (
      <div className="pointer-events-none inline-flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Installing…
      </div>
    );
  }

  // status.phase === 'error' — keep silent in the header; the console drawer
  // already logged the failure via useUpdater's addLog.
  return null;
}

export default memo(UpdateBadge);
