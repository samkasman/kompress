import { Folder, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessingFile } from '../App';

interface DropAreaProps {
  isDragging: boolean;
  onFileDialog: () => void;
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
      <div className="text-center pointer-events-none mb-8">
        <Folder
          className={`h-24 w-24 text-slate-100 mx-auto mb-4 transition-transform ${
            isDragging ? 'scale-110' : ''
          }`}
        />
        <p className="text-xl font-semibold text-slate-100 mb-2">
          {isDragging ? 'Drop files here' : 'Click or drag files to compress'}
        </p>
        <p className="text-xs text-slate-400">
          PNG, JPG, JPEG, MOV, MP4, WAV, MP3, AAC, FLAC, M4A, OGG, WMA
        </p>
      </div>

      {hasFiles && (
        <div
          ref={fileListRef}
          className="w-full max-w-md max-h-[192px] overflow-y-auto space-y-2"
        >
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 text-sm">
              <File className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-100 truncate flex-1">
                {file.name}
              </span>
              {file.status === 'processing' && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                  <span className="text-slate-400 text-xs">Processing...</span>
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
