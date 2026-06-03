import { useCallback, useEffect, useRef, useState } from 'react';
import { FileInfo, getFileType, isValidFileType } from '@/utils/fileUtils';
import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';
import { ProcessingFile } from '@/App';
import { useSettings } from '@/hooks/useSettings';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useFileProcessor } from '@/hooks/useFileProcessor';
import { ALL_INPUT_EXTS } from '@/constants/formats';
import Header from '@/components/Header';
import SettingsDrawer from '@/components/SettingsDrawer';
import ConsoleDrawer from '@/components/ConsoleDrawer';
import DropArea from '@/components/DropArea';

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
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isConsoleClosing, setIsConsoleClosing] = useState(false);
  const fileListRef = useRef<HTMLDivElement>(null);

  const { settings, setImageQuality, setVideoCRF, setAudioBitrate } =
    useSettings();

  const addLog = useCallback((message: string) => {
    setDebugLogs((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(message);
  }, []);

  const { processFile } = useFileProcessor({
    imageQuality: settings.imageQuality,
    videoCRF: settings.videoCRF,
    audioBitrate: settings.audioBitrate,
    onFileUpdate,
    addLog,
  });

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
        filters: [{ name: 'Media Files', extensions: [...ALL_INPUT_EXTS] }],
      });

      if (selected) {
        const filePaths = Array.isArray(selected) ? selected : [selected];
        await processFilePaths(filePaths);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  }, [processFilePaths]);

  const {
    isDragging,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    onFilesDropped: processFilePaths,
    addLog,
    showDrawer,
  });

  useEffect(() => {
    files.forEach((file) => {
      if (file.status === 'pending') {
        processFile(file);
      }
    });
  }, [files, processFile]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDrawer(false);
        setShowConsole(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-10 overflow-hidden ${
        isDragging ? 'bg-slate-800/50' : ''
      }`}
    >
      <div
        className={`flex h-full transition-transform duration-300 ${
          (showDrawer && !isDrawerClosing) || (showConsole && !isConsoleClosing)
            ? '-translate-x-1/2'
            : 'translate-x-0'
        }`}
        style={{ width: '200%' }}
      >
        {/* Main content panel */}
        <div
          className="w-1/2 h-full flex flex-col cursor-pointer"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Header
            showSK={showSK}
            onSettingsClick={() => {
              if (showDrawer) {
                setIsDrawerClosing(true);
                setTimeout(() => {
                  setShowDrawer(false);
                  setIsDrawerClosing(false);
                }, 300);
              } else {
                setShowDrawer(true);
              }
            }}
            onConsoleClick={() => {
              if (showConsole) {
                setIsConsoleClosing(true);
                setTimeout(() => {
                  setShowConsole(false);
                  setIsConsoleClosing(false);
                }, 300);
              } else {
                setShowConsole(true);
              }
            }}
          />

          <DropArea
            isDragging={isDragging}
            onFileDialog={handleFileDialog}
            files={files}
            elapsedTimes={elapsedTimes}
            fileListRef={fileListRef}
          />
        </div>

        {/* Drawer panel */}
        <div
          data-no-drag
          className="w-1/2 h-full pointer-events-auto overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {(showDrawer || isDrawerClosing) && (
            <SettingsDrawer
              imageQuality={settings.imageQuality}
              videoCRF={settings.videoCRF}
              audioBitrate={settings.audioBitrate}
              onImageQualityChange={setImageQuality}
              onVideoCRFChange={setVideoCRF}
              onAudioBitrateChange={setAudioBitrate}
              onClose={() => {
                setIsDrawerClosing(true);
                setTimeout(() => {
                  setShowDrawer(false);
                  setIsDrawerClosing(false);
                }, 300);
              }}
            />
          )}

          {(showConsole || isConsoleClosing) && (
            <ConsoleDrawer
              logs={debugLogs}
              onClose={() => {
                setIsConsoleClosing(true);
                setTimeout(() => {
                  setShowConsole(false);
                  setIsConsoleClosing(false);
                }, 300);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
