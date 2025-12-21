import { useCallback, useEffect, useState } from 'react';
import { FileInfo, getFileType, isValidFileType } from '../utils/fileUtils';
import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { ProcessingFile } from '../App';
import {
  CheckCircle,
  AlertCircle,
  File,
  Folder,
  Loader2,
  Settings,
  X,
} from 'lucide-react';

interface DropZoneProps {
  files: ProcessingFile[];
  onFilesAdded: (files: FileInfo[]) => void;
  onFileUpdate: (id: string, updates: Partial<ProcessingFile>) => void;
  showSK: boolean;
}

export default function DropZone({
  files,
  onFilesAdded,
  onFileUpdate,
  showSK,
}: DropZoneProps) {
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});
  const [showDrawer, setShowDrawer] = useState(false);
  const [imageQuality, setImageQuality] = useState(6);
  const [videoCRF, setVideoCRF] = useState(22);
  const [audioBitrate, setAudioBitrate] = useState(320);

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
          imageQuality,
          videoCRF,
          audioBitrate,
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
    [onFileUpdate, imageQuality, videoCRF, audioBitrate]
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
            extensions: [
              'png',
              'jpg',
              'jpeg',
              'mov',
              'mp4',
              'wav',
              'mp3',
              'aac',
              'flac',
              'm4a',
              'ogg',
              'wma',
            ],
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
    <div
      className="fixed inset-0 cursor-pointer z-10"
      onClick={handleFileDialog}
    >
      {/* Top container with SK and settings */}
      <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-start justify-between p-4">
          {/* SK Logo and subtitle - left */}
          <div>
            <h1
              className={`text-2xl font-bold text-slate-100 leading-none transition-opacity duration-500 ${
                showSK ? 'opacity-100' : 'opacity-0'
              }`}
            >
              sk-compress
            </h1>
            <p
              className={`text-xs text-slate-400 mt-1 transition-opacity duration-500 ${
                showSK ? 'opacity-100' : 'opacity-0'
              }`}
            >
              A dead simple media compressor
            </p>
          </div>

          {/* Settings button - right */}
          <button
            className="p-2 text-slate-100 hover:text-slate-200 transition-colors pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowDrawer(!showDrawer);
            }}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Drawer backdrop */}
      {showDrawer && (
        <div
          className="fixed inset-0 bg-black/50 z-30 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            setShowDrawer(false);
          }}
        />
      )}

      {/* Drawer from right */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-md z-40 pointer-events-auto transition-transform duration-300 ease-in-out ${
          showDrawer ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-100" />
              <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
            </div>
            <button
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setShowDrawer(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Settings sections */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-200">Images</p>
                <p className="text-xs text-slate-400">PNG/JPG → JPG</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="image-quality"
                    className="text-xs text-slate-400"
                  >
                    Quality:
                  </label>
                  <span className="text-xs text-slate-300">{imageQuality}</span>
                </div>
                <input
                  type="range"
                  id="image-quality"
                  min={1}
                  max={8}
                  step={1}
                  value={9 - imageQuality}
                  onChange={(e) => setImageQuality(9 - Number(e.target.value))}
                  className="w-full appearance-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>8 (Smallest)</span>
                  <span>1 (Best)</span>
                </div>
              </div>
            </div>
            <hr className="border-slate-700" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-200">Videos</p>
                <p className="text-xs text-slate-400">MOV/MP4 → MP4</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="video-crf" className="text-xs text-slate-400">
                    CRF:
                  </label>
                  <span className="text-xs text-slate-300">{videoCRF}</span>
                </div>
                <input
                  type="range"
                  id="video-crf"
                  min={18}
                  max={28}
                  step={1}
                  value={46 - videoCRF}
                  onChange={(e) => setVideoCRF(46 - Number(e.target.value))}
                  className="w-full appearance-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>28 (Smallest)</span>
                  <span>18 (Best)</span>
                </div>
              </div>
            </div>
            <hr className="border-slate-700" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-200">Audio</p>
                <p className="text-xs text-slate-400">WAV/MP3 → MP3</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="audio-bitrate"
                    className="text-xs text-slate-400"
                  >
                    Bitrate:
                  </label>
                  <span className="text-xs text-slate-300">
                    {audioBitrate} kbps
                  </span>
                </div>
                <input
                  type="range"
                  id="audio-bitrate"
                  min={128}
                  max={320}
                  step={64}
                  value={audioBitrate}
                  onChange={(e) => setAudioBitrate(Number(e.target.value))}
                  className="w-full appearance-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>128 kbps (Smallest)</span>
                  <span>320 kbps (Best)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center pointer-events-none mb-8">
          <Folder className="h-24 w-24 text-slate-100 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-100 mb-6">
            Click to select files
          </p>
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
