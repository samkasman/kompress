import { useCallback, useEffect, useState } from 'react';
import { FileInfo, getFileType, isValidFileType } from '../utils/fileUtils';
import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { ProcessingFile } from '../App';
import { CheckCircle, AlertCircle, File, Folder, Loader2 } from 'lucide-react';

interface DropZoneProps {
  files: ProcessingFile[];
  onFilesAdded: (files: FileInfo[]) => void;
  onFileUpdate: (id: string, updates: Partial<ProcessingFile>) => void;
}

export default function DropZone({
  files,
  onFilesAdded,
  onFileUpdate,
}: DropZoneProps) {
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});

  // Track elapsed time for processing files
  useEffect(() => {
    const processingFiles = files.filter((f) => f.status === 'processing');
    if (processingFiles.length === 0) return;

    const interval = setInterval(() => {
      setElapsedTimes((prev) => {
        const updated = { ...prev };
        processingFiles.forEach((file) => {
          updated[file.id] = (updated[file.id] || 0) + 1;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [files]);

  // Format elapsed time as M:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processFile = useCallback(
    async (file: ProcessingFile) => {
      // Start timer
      setElapsedTimes((prev) => ({ ...prev, [file.id]: 0 }));
      onFileUpdate(file.id, { status: 'processing', progress: 0 });

      try {
        const result = await invoke<{
          output_path: string;
          output_size: number;
        }>('compress_file', {
          inputPath: file.path,
          fileType: file.type,
          fileId: file.id,
        });

        onFileUpdate(file.id, {
          status: 'complete',
          progress: 100,
          outputPath: result.output_path,
          outputSize: result.output_size,
        });
      } catch (error) {
        const errorMessage =
          typeof error === 'string'
            ? error
            : error instanceof Error
              ? error.message
              : 'Unknown error occurred';
        console.error('Compression error:', error);
        onFileUpdate(file.id, { status: 'error', error: errorMessage });
      }
    },
    [onFileUpdate]
  );

  // Process pending files
  useEffect(() => {
    files.forEach((file) => {
      if (file.status === 'pending') {
        processFile(file);
      }
    });
  }, [files, processFile]);

  const handleFileDialog = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Media Files',
            extensions: ['png', 'jpg', 'jpeg', 'mov', 'mp4'],
          },
        ],
      });

      if (selected) {
        const filePaths = Array.isArray(selected) ? selected : [selected];
        const validFiles: FileInfo[] = [];

        for (const filePath of filePaths) {
          if (isValidFileType(filePath)) {
            const pathParts = filePath.split(/[/\\]/);
            const fileName = pathParts[pathParts.length - 1];

            try {
              const fileMetadata = await stat(filePath);
              const fileSize = fileMetadata.size || 0;

              validFiles.push({
                path: filePath,
                name: fileName,
                type: getFileType(filePath),
                size: fileSize,
              });
            } catch (error) {
              // If we can't get file size, still add the file with size 0
              validFiles.push({
                path: filePath,
                name: fileName,
                type: getFileType(filePath),
                size: 0,
              });
            }
          }
        }

        if (validFiles.length > 0) {
          onFilesAdded(validFiles);
        }
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  }, [onFilesAdded]);

  const hasFiles = files.length > 0;

  return (
    <div className="fixed inset-0 cursor-pointer z-10" onClick={handleFileDialog}>
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center pointer-events-none mb-8">
          <Folder className="h-24 w-24 text-slate-100 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-100">
            Click to select files
          </p>
          <p className="text-xs text-slate-400 mt-2">PNG, JPG, MOV, MP4</p>
        </div>

        {hasFiles && (
          <div className="w-full max-w-md space-y-2 pointer-events-none">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 text-sm">
                <File className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-100 truncate flex-1">
                  {file.name}
                </span>
                {file.status === 'processing' && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                    <span className="text-slate-400 text-xs">
                      Processing...
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
    </div>
  );
}
