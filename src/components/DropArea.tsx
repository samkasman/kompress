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

const FORMAT_CATEGORIES: { type: SupportedFileType; mark: string }[] = [
  { type: 'image', mark: 'I' },
  { type: 'video', mark: 'V' },
  { type: 'audio', mark: 'A' },
];

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
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Decisive drag state — the entire content area gets a hairline white
          inset frame plus a slight backdrop tint. There is zero ambiguity
          about whether the drop is registered. */}
      {isDragging && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 z-30 border border-zinc-100/80 transition-opacity"
        />
      )}

      {hasFiles ? (
        <DropStrip isDragging={isDragging} onClick={onFileDialog} />
      ) : (
        <EmptyState isDragging={isDragging} onClick={onFileDialog} />
      )}

      {hasFiles && (
        <div ref={fileListRef} className="flex-1 min-h-0 overflow-y-auto">
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
      className="flex-1 flex flex-col items-center justify-center w-full px-5 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-0 group"
    >
      {/* Spec-sheet style format table — the empty state's signature element.
          Sized to fit the audio row on one line; markers brighter than the
          input list so the row reads "type | inputs → output" at a glance. */}
      <div className="w-full max-w-[320px] border-y border-zinc-800">
        {FORMAT_CATEGORIES.map(({ type, mark }, idx) => (
          <div
            key={type}
            className={`flex items-baseline gap-4 px-2 py-2.5 ${
              idx < FORMAT_CATEGORIES.length - 1
                ? 'border-b border-zinc-900'
                : ''
            }`}
          >
            <span className="font-mono text-[11px] text-zinc-500 w-2 flex-shrink-0">
              {mark}
            </span>
            <span className="font-mono text-[11px] uppercase text-zinc-300 text-left flex-1 whitespace-nowrap">
              {FORMATS[type].inputExts.join(' ')}
            </span>
            <span className="font-mono text-[11px] uppercase text-zinc-500 flex-shrink-0">
              → {FORMATS[type].outputExt}
            </span>
          </div>
        ))}
      </div>

      <p
        className={`mt-8 font-mono text-[9px] uppercase tracking-[0.32em] transition-colors ${
          isDragging
            ? 'text-zinc-100'
            : 'text-zinc-600 group-hover:text-zinc-400'
        }`}
      >
        {isDragging ? '— release —' : 'drop or click'}
      </p>
    </button>
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
      className={`flex items-center justify-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 border-b border-zinc-900 transition-colors hover:text-zinc-200 hover:bg-zinc-900/40 focus-visible:outline-none focus-visible:ring-0 ${
        isDragging ? 'bg-zinc-900/60 text-zinc-100' : ''
      }`}
    >
      <Plus className="h-3 w-3" strokeWidth={1.5} />
      {isDragging ? '— release —' : 'drop or click to add'}
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
    <li className="group flex items-center gap-3 px-3 py-2 text-xs hover:bg-zinc-900/30 transition-colors">
      <span className="flex-1 truncate text-zinc-100 font-mono text-[12px]">
        {file.name}
      </span>

      {file.status === 'pending' && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          queued
        </span>
      )}

      {file.status === 'processing' && (
        <div className="flex items-center gap-2 text-zinc-400 tabular-nums">
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
          {file.progress > 0 && (
            <span className="font-mono text-[11px]">{file.progress}%</span>
          )}
          <span className="font-mono text-[11px] text-zinc-600">
            {formatTime(elapsed)}
          </span>
        </div>
      )}

      {file.status === 'complete' && (
        <div className="flex items-center gap-2 tabular-nums">
          {savedPercent !== null && (
            <span className="font-mono text-[11px] text-zinc-200">
              −{savedPercent}%
            </span>
          )}
          <Check className="h-3 w-3 text-zinc-500" strokeWidth={2} />
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
              className="text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-100 transition-opacity"
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
          <span className="font-mono text-[10px] uppercase tracking-wider">
            failed
          </span>
        </div>
      )}
    </li>
  );
}
