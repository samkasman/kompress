import { Loader2, CheckCircle, AlertCircle, FolderOpen, Upload, Image, Film, Music } from 'lucide-react';
import { ProcessingFile } from '@/App';
import { FormatBadge } from '@/components/ui/format-badge';
import { IconButton } from '@/components/ui/icon-button';

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
    <div
      className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto cursor-pointer"
      onClick={onFileDialog}
    >
      <div className="text-center pointer-events-none mb-4">
        <Upload
          className={`mx-auto mb-3 h-12 w-12 text-slate-300 transition-transform ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}
        />
        <p className="text-base font-semibold text-slate-100 mb-3">
          {isDragging ? 'Drop files here' : 'Click or drag files to compress'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <FormatBadge type="image" />
          <FormatBadge type="video" />
          <FormatBadge type="audio" />
        </div>
      </div>

      {hasFiles && (
        <div
          ref={fileListRef}
          className="w-full max-w-md max-h-[50vh] overflow-y-auto space-y-2"
        >
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 text-sm">
              {file.type === 'image' && <Image className="h-4 w-4 text-blue-400 flex-shrink-0" />}
              {file.type === 'video' && <Film className="h-4 w-4 text-purple-400 flex-shrink-0" />}
              {file.type === 'audio' && <Music className="h-4 w-4 text-green-400 flex-shrink-0" />}
              <span className="text-slate-100 truncate flex-1">
                {file.name}
              </span>
              {file.status === 'processing' && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                  <span className="text-slate-400 text-xs">
                    {file.progress > 0 ? `${file.progress}%` : 'Processing...'}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {formatTime(elapsedTimes[file.id] || 0)}
                  </span>
                </div>
              )}
              {file.status === 'complete' && (
                <>
                  {file.size > 0 && file.outputSize !== undefined && (
                    <span className="text-green-400 text-xs">
                      {Math.round((1 - file.outputSize / file.size) * 100)}%
                      saved
                    </span>
                  )}
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  {file.outputPath && (
                    <IconButton
                      variant="subtle"
                      size="sm"
                      title="Show in Finder"
                      aria-label="Show in Finder"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevealInFolder(file.outputPath!);
                      }}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                    </IconButton>
                  )}
                </>
              )}
              {file.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
