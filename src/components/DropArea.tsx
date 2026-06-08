import {
  Loader2,
  Check,
  AlertTriangle,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { ProcessingFile } from '@/App';
import { FORMATS, type SupportedFileType } from '@/constants/formats';

interface DropAreaProps {
  isDragging: boolean;
  onFileDialog: () => void;
  onRevealInFolder: (path: string) => void;
  files: ProcessingFile[];
  elapsedTimes: Record<string, number>;
  fileListRef: React.RefObject<HTMLDivElement>;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const FORMAT_CATEGORIES: SupportedFileType[] = ['image', 'video', 'audio'];

export default function DropArea({
  isDragging,
  onFileDialog,
  onRevealInFolder,
  files,
  elapsedTimes,
  fileListRef,
}: DropAreaProps) {
  const hasFiles = files.length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {hasFiles ? (
        <DropStrip isDragging={isDragging} onClick={onFileDialog} />
      ) : (
        <EmptyState isDragging={isDragging} onClick={onFileDialog} />
      )}

      {hasFiles && (
        <div
          ref={fileListRef}
          className="flex-1 min-h-0 overflow-y-auto px-2 py-1"
        >
          <ul className="divide-y divide-zinc-900/80">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                elapsed={elapsedTimes[file.id] ?? 0}
                onReveal={onRevealInFolder}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  isDragging,
  onClick,
}: {
  isDragging: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center w-full text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 ${
        isDragging ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/30'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 mb-6">
        {isDragging ? 'Release to compress' : 'Click or drop files'}
      </p>

      <div className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-zinc-600">
        {FORMAT_CATEGORIES.map((type) => (
          <FormatLine key={type} type={type} />
        ))}
      </div>
    </button>
  );
}

function FormatLine({ type }: { type: SupportedFileType }) {
  const exts = FORMATS[type].inputExts;
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-right text-zinc-700">{type}</span>
      <span className="text-zinc-500">{exts.join(' · ').toUpperCase()}</span>
    </div>
  );
}

function DropStrip({
  isDragging,
  onClick,
}: {
  isDragging: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 border-b border-zinc-900 transition-colors hover:text-zinc-300 hover:bg-zinc-900/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 ${
        isDragging ? 'bg-zinc-900/50 text-zinc-300' : ''
      }`}
    >
      <Plus className="h-3 w-3" strokeWidth={1.5} />
      {isDragging ? 'Release to add' : 'Drop more or click'}
    </button>
  );
}

function FileRow({
  file,
  elapsed,
  onReveal,
}: {
  file: ProcessingFile;
  elapsed: number;
  onReveal: (path: string) => void;
}) {
  const savedPercent =
    file.status === 'complete' && file.size > 0 && file.outputSize !== undefined
      ? Math.round((1 - file.outputSize / file.size) * 100)
      : null;

  return (
    <li className="group flex items-center gap-3 px-2 py-2 text-xs">
      <span className="flex-1 truncate text-zinc-200 font-mono text-[12px]">
        {file.name}
      </span>

      {file.status === 'pending' && (
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">
          queued
        </span>
      )}

      {file.status === 'processing' && (
        <div className="flex items-center gap-2 text-zinc-400 tabular-nums">
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
          {file.progress > 0 && (
            <span className="text-[11px]">{file.progress}%</span>
          )}
          <span className="text-[11px] text-zinc-600">
            {formatTime(elapsed)}
          </span>
        </div>
      )}

      {file.status === 'complete' && (
        <div className="flex items-center gap-2 tabular-nums">
          {savedPercent !== null && (
            <span className="text-[11px] text-zinc-300">−{savedPercent}%</span>
          )}
          <Check className="h-3 w-3 text-zinc-400" strokeWidth={2} />
          {file.outputPath && (
            <button
              type="button"
              data-no-drag
              title="Show in Finder"
              aria-label="Show in Finder"
              onClick={(e) => {
                e.stopPropagation();
                onReveal(file.outputPath!);
              }}
              className="text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-200 transition-opacity"
            >
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      {file.status === 'error' && (
        <div
          className="flex items-center gap-1 text-zinc-400"
          title={file.error}
        >
          <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-wider">failed</span>
        </div>
      )}
    </li>
  );
}
