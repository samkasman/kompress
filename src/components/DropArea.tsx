import { Image, Video, Music, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
      <div className="text-center pointer-events-none mb-4">
        <p className="text-base font-semibold text-slate-100 mb-3">
          {isDragging ? 'Drop files here' : 'Click or drag files to compress'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
            <Image className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-medium text-blue-300">PNG, JPG, JPEG, HEIC, WEBP</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
            <Video className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[10px] font-medium text-purple-300">MOV, MP4, MKV</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md">
            <Music className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[10px] font-medium text-green-300">WAV, MP3, AAC, FLAC, M4A, OGG, WMA</span>
          </div>
        </div>
      </div>

      {hasFiles && (
        <div
          ref={fileListRef}
          className="w-full max-w-md max-h-[192px] overflow-y-auto space-y-2"
        >
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 text-sm">
              {file.type === 'image' && <Image className="h-4 w-4 text-blue-400 flex-shrink-0" />}
              {file.type === 'video' && <Video className="h-4 w-4 text-purple-400 flex-shrink-0" />}
              {file.type === 'audio' && <Music className="h-4 w-4 text-green-400 flex-shrink-0" />}
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
