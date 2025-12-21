import { useCallback, useEffect, useRef, useState } from 'react';
import { FileInfo, getFileType, isValidFileType } from '../utils/fileUtils';
import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ProcessingFile } from '../App';
import {
  CheckCircle,
  AlertCircle,
  File,
  Folder,
  Loader2,
  Settings,
  X,
  Minimize2,
  Terminal,
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
  const [isDragging, setIsDragging] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const debugLogsRef = useRef<HTMLDivElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);
  const isProcessingDrop = useRef(false);

  const addLog = useCallback((message: string) => {
    setDebugLogs((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(message);
  }, []);

  useEffect(() => {
    const savedImageQuality = localStorage.getItem('sk-compress:imageQuality');
    const savedVideoCRF = localStorage.getItem('sk-compress:videoCRF');
    const savedAudioBitrate = localStorage.getItem('sk-compress:audioBitrate');

    if (savedImageQuality) {
      const value = Number(savedImageQuality);
      if (value >= 1 && value <= 8) setImageQuality(value);
    }
    if (savedVideoCRF) {
      const value = Number(savedVideoCRF);
      if (value >= 18 && value <= 28) setVideoCRF(value);
    }
    if (savedAudioBitrate) {
      const value = Number(savedAudioBitrate);
      if (value >= 128 && value <= 320) setAudioBitrate(value);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sk-compress:imageQuality', imageQuality.toString());
  }, [imageQuality]);

  useEffect(() => {
    localStorage.setItem('sk-compress:videoCRF', videoCRF.toString());
  }, [videoCRF]);

  useEffect(() => {
    localStorage.setItem('sk-compress:audioBitrate', audioBitrate.toString());
  }, [audioBitrate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debugLogsRef.current) {
        const { scrollHeight, clientHeight } = debugLogsRef.current;
        if (scrollHeight > clientHeight) {
          debugLogsRef.current.scrollTop = scrollHeight;
        }
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [debugLogs, showConsole]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDrawer(false);
        setShowConsole(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (fileListRef.current && files.length > 0) {
      const timer = setTimeout(() => {
        if (fileListRef.current) {
          const { scrollHeight, clientHeight } = fileListRef.current;
          if (scrollHeight > clientHeight) {
            fileListRef.current.scrollTop = scrollHeight;
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [files]);

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processFile = useCallback(
    async (file: ProcessingFile) => {
      setElapsedTimes((prev) => ({ ...prev, [file.id]: 0 }));
      onFileUpdate(file.id, { status: 'processing', progress: 0 });

      addLog(`⏳ Processing: ${file.name} (${file.type})`);

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

        const savedPercent =
          file.size > 0
            ? Math.round((1 - result.output_size / file.size) * 100)
            : 0;
        addLog(`✅ Complete: ${file.name} (${savedPercent}% saved)`);

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
        addLog(`❌ Error: ${file.name} - ${errorMessage}`);
        onFileUpdate(file.id, { status: 'error', error: errorMessage });
      }
    },
    [onFileUpdate, imageQuality, videoCRF, audioBitrate, addLog]
  );

  useEffect(() => {
    files.forEach((file) => {
      if (file.status === 'pending') {
        processFile(file);
      }
    });
  }, [files, processFile]);

  const processFilePaths = useCallback(
    async (filePaths: string[]) => {
      const validFiles: FileInfo[] = [];

      const existingPaths = new Set(files.map((f) => f.path));

      for (const filePath of filePaths) {
        if (existingPaths.has(filePath)) {
          addLog(`Skipping duplicate: ${filePath}`);
          continue;
        }

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
        addLog(`Adding ${validFiles.length} new file(s)`);
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded, files, addLog]
  );

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
        await processFilePaths(filePaths);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  }, [processFilePaths]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupFileDrop = async () => {
      try {
        // addLog('Setting up Tauri v2 drag-drop listener...');

        const appWindow = getCurrentWindow();

        unlisten = await appWindow.onDragDropEvent((event) => {
          // addLog(`🎯 Tauri drag-drop event: ${event.payload.type}`);

          if (event.payload.type === 'enter' || event.payload.type === 'over') {
            setIsDragging(true);
          } else if (event.payload.type === 'drop') {
            setIsDragging(false);

            if (isProcessingDrop.current) {
              return;
            }

            isProcessingDrop.current = true;
            const paths = event.payload.paths;
            addLog(`Dropped ${paths.length} file(s): ${paths.join(', ')}`);

            if (paths.length > 0 && !showDrawer) {
              processFilePaths(paths);
            }

            setTimeout(() => {
              isProcessingDrop.current = false;
            }, 500);
          } else if (event.payload.type === 'leave') {
            setIsDragging(false);
          }
        });

        // addLog('✓ Tauri v2 drag-drop listener registered');
      } catch (error) {
        const errorMsg = `❌ Failed to set up drag-drop listener: ${error}`;
        addLog(errorMsg);
        console.error(errorMsg, error);
      }
    };

    setupFileDrop();

    return () => {
      if (unlisten) unlisten();
    };
  }, [processFilePaths, showDrawer, addLog]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Don't show drag state if over drawer or settings button
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]')) return;

      if (!isDragging) {
        setIsDragging(true);
        addLog('Drag over detected');
      }
    },
    [isDragging, addLog]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Don't show drag state if over drawer or settings button
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]')) return;

      setIsDragging(true);
      addLog('🎯 Drag enter detected!');
    },
    [addLog]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      addLog('HTML5 drop event (Tauri handles files)');
    },
    [addLog]
  );

  const hasFiles = files.length > 0;

  return (
    <div
      className={`fixed inset-0 z-10 overflow-hidden ${
        isDragging ? 'bg-slate-800/50' : ''
      }`}
    >
      <div
        className={`flex h-full transition-transform duration-300 ${
          showDrawer || showConsole ? '-translate-x-1/2' : 'translate-x-0'
        }`}
        style={{ width: '200%' }}
      >
        {/* Main content panel - 50% of container = 100% viewport */}
        <div
          className="w-1/2 h-full flex flex-col cursor-pointer"
          onClick={handleFileDialog}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="relative flex-shrink-0 pointer-events-none z-20">
            <div className="flex items-start justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Minimize2
                    className={`h-4 w-4 text-slate-100 transition-opacity duration-500 ${
                      showSK ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <h1
                    className={`text-2xl font-bold text-slate-100 leading-none transition-opacity duration-500 ${
                      showSK ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    sk-compress
                  </h1>
                </div>
                <p
                  className={`text-xs text-slate-400 mt-1 transition-opacity duration-500 ${
                    showSK ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  A dead simple multimedia compressor
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  data-no-drag
                  className="p-2 text-slate-100 hover:text-slate-200 transition-colors pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConsole(!showConsole);
                  }}
                >
                  <Terminal className="h-5 w-5" />
                </button>
                <button
                  data-no-drag
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
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="text-center pointer-events-none mb-8">
              <Folder
                className={`h-24 w-24 text-slate-100 mx-auto mb-4 transition-transform ${
                  isDragging ? 'scale-110' : ''
                }`}
              />
              <p className="text-xl font-semibold text-slate-100 mb-2">
                {isDragging
                  ? 'Drop files here'
                  : 'Click or drag files to compress'}
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
                  <div
                    key={file.id}
                    className="flex items-center gap-3 text-sm"
                  >
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
                            {Math.round(
                              (1 - file.outputSize / file.size) * 100
                            )}
                            % saved
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

        {/* Drawer panel - 50% of container = 100% viewport */}
        <div
          data-no-drag
          className="w-1/2 h-full pointer-events-auto overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {showDrawer && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-100" />
                  <h2 className="text-lg font-semibold text-slate-100">
                    Settings
                  </h2>
                </div>
                <button
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  onClick={() => setShowDrawer(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-slate-950/50 rounded-lg p-3 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-200">
                      Images
                    </p>
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
                      <span className="text-xs text-slate-300">
                        {imageQuality}
                      </span>
                    </div>
                    <input
                      type="range"
                      id="image-quality"
                      min={1}
                      max={8}
                      step={1}
                      value={9 - imageQuality}
                      onChange={(e) =>
                        setImageQuality(9 - Number(e.target.value))
                      }
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
                    <p className="text-sm font-semibold text-slate-200">
                      Videos
                    </p>
                    <p className="text-xs text-slate-400">MOV/MP4 → MP4</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="video-crf"
                        className="text-xs text-slate-400"
                      >
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
                    <p className="text-sm font-semibold text-slate-200">
                      Audio
                    </p>
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
          )}

          {showConsole && (
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-slate-100" />
                  <h2 className="text-lg font-semibold text-slate-100">
                    Console
                  </h2>
                </div>
                <button
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  onClick={() => setShowConsole(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div
                ref={debugLogsRef}
                className="flex-1 overflow-y-auto bg-slate-950/50 rounded-lg p-3"
              >
                {debugLogs.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono">
                    No logs yet...
                  </div>
                ) : (
                  debugLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-400 font-mono leading-5"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
