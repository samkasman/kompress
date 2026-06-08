import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';
import { FileInfo, getFileType, isValidFileType } from '@/utils/fileUtils';
import { ProcessingFile } from '@/App';
import { useSettings } from '@/hooks/useSettings';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useFileProcessor } from '@/hooks/useFileProcessor';
import { useUpdater } from '@/hooks/useUpdater';
import { ALL_INPUT_EXTS } from '@/constants/formats';
import Header from '@/components/Header';
import SettingsDrawer from '@/components/SettingsDrawer';
import ConsoleDrawer from '@/components/ConsoleDrawer';
import DropArea from '@/components/DropArea';
import UpdateBadge from '@/components/UpdateBadge';

interface DropZoneProps {
  files: ProcessingFile[];
  onFilesAdded: (files: FileInfo[]) => void;
  onFileUpdate: (id: string, updates: Partial<ProcessingFile>) => void;
  showSK: boolean;
}

type PanelName = 'settings' | 'console';
type PanelState =
  | { phase: 'closed' }
  | { phase: 'open'; panel: PanelName }
  | { phase: 'closing'; panel: PanelName };

type PanelAction =
  | { type: 'open'; panel: PanelName }
  | { type: 'close' }
  | { type: 'animation-end' };

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'open':
      return { phase: 'open', panel: action.panel };
    case 'close':
      return state.phase === 'open'
        ? { phase: 'closing', panel: state.panel }
        : state;
    case 'animation-end':
      return state.phase === 'closing' ? { phase: 'closed' } : state;
  }
}

const MAX_DEBUG_LOGS = 10;

export default function DropZone({
  files,
  onFilesAdded,
  onFileUpdate,
  showSK,
}: DropZoneProps) {
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [panel, dispatchPanel] = useReducer(panelReducer, { phase: 'closed' });
  const fileListRef = useRef<HTMLDivElement>(null);
  const startedFileIds = useRef<Set<string>>(new Set());

  const {
    settings,
    setImageQuality,
    setVideoCRF,
    setAudioBitrate,
    resetDefaults,
  } = useSettings();

  const addLog = useCallback((message: string) => {
    setDebugLogs((prev) => [
      ...prev.slice(-(MAX_DEBUG_LOGS - 1)),
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

  const { status: updateStatus, installUpdate } = useUpdater({ addLog });

  const processFilePaths = useCallback(
    async (filePaths: string[]) => {
      const existingPaths = new Set(files.map((f) => f.path));
      const validFiles: FileInfo[] = [];

      for (const filePath of filePaths) {
        if (existingPaths.has(filePath)) {
          addLog(`Skipping duplicate: ${filePath}`);
          continue;
        }
        if (!isValidFileType(filePath)) continue;

        const pathParts = filePath.split(/[/\\]/);
        const fileName = pathParts[pathParts.length - 1];

        let fileSize = 0;
        try {
          const fileMetadata = await stat(filePath);
          fileSize = fileMetadata.size || 0;
        } catch {
          // Couldn't stat — proceed with size 0, ffmpeg will still try.
        }

        validFiles.push({
          path: filePath,
          name: fileName,
          type: getFileType(filePath),
          size: fileSize,
        });
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

  const isPanelOpen = panel.phase === 'open';
  const isPanelVisible = panel.phase !== 'closed';

  const handleClosePanel = useCallback(
    () => dispatchPanel({ type: 'close' }),
    []
  );

  const {
    isDragging,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    onFilesDropped: processFilePaths,
    addLog,
    showDrawer: isPanelOpen,
    onDrawerClose: handleClosePanel,
  });

  useEffect(() => {
    for (const file of files) {
      if (file.status === 'pending' && !startedFileIds.current.has(file.id)) {
        startedFileIds.current.add(file.id);
        processFile(file);
      }
    }
  }, [files, processFile]);

  // Track currently-processing IDs in a ref so the 1s timer below doesn't
  // tear down and recreate on every file update (which would reset its
  // sub-second phase and drift elapsed times).
  const processingIdsRef = useRef<string[]>([]);
  useEffect(() => {
    processingIdsRef.current = files
      .filter((f) => f.status === 'processing')
      .map((f) => f.id);
  }, [files]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ids = processingIdsRef.current;
      if (ids.length === 0) return;
      setElapsedTimes((prev) => {
        const updated = { ...prev };
        for (const id of ids) {
          updated[id] = (updated[id] || 0) + 1;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!fileListRef.current || files.length === 0) return;
    const timer = setTimeout(() => {
      const el = fileListRef.current;
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatchPanel({ type: 'close' });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSettingsClick = useCallback(() => {
    dispatchPanel(
      panel.phase === 'open' && panel.panel === 'settings'
        ? { type: 'close' }
        : { type: 'open', panel: 'settings' }
    );
  }, [panel]);

  const handleConsoleClick = useCallback(() => {
    dispatchPanel(
      panel.phase === 'open' && panel.panel === 'console'
        ? { type: 'close' }
        : { type: 'open', panel: 'console' }
    );
  }, [panel]);

  const handleRevealInFolder = useCallback(
    async (path: string) => {
      try {
        await invoke('reveal_in_folder', { path });
      } catch (error) {
        addLog(`❌ Show in Finder failed: ${error}`);
      }
    },
    [addLog]
  );

  const handleSlideTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      // Only react to the outer container's own transform transition —
      // not bubbled transitions from descendants.
      if (e.target === e.currentTarget && e.propertyName === 'transform') {
        dispatchPanel({ type: 'animation-end' });
      }
    },
    []
  );

  return (
    <div
      className={`fixed inset-0 z-10 overflow-hidden ${
        isDragging ? 'bg-zinc-900/60' : ''
      }`}
    >
      {/* macOS Overlay title bar reserves ~28px at the top. Push everything
          below it so the traffic lights don't overlap the header buttons. */}
      <div
        className={`flex h-[calc(100vh-28px)] mt-[28px] transition-transform duration-300 ${
          isPanelOpen ? '-translate-x-1/2' : 'translate-x-0'
        }`}
        style={{ width: '200%' }}
        onTransitionEnd={handleSlideTransitionEnd}
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
            onSettingsClick={handleSettingsClick}
            onConsoleClick={handleConsoleClick}
            toolbarSlot={
              <UpdateBadge status={updateStatus} onInstall={installUpdate} />
            }
          />
          <DropArea
            isDragging={isDragging}
            onFileDialog={handleFileDialog}
            onRevealInFolder={handleRevealInFolder}
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
          {isPanelVisible && panel.panel === 'settings' && (
            <SettingsDrawer
              imageQuality={settings.imageQuality}
              videoCRF={settings.videoCRF}
              audioBitrate={settings.audioBitrate}
              onImageQualityChange={setImageQuality}
              onVideoCRFChange={setVideoCRF}
              onAudioBitrateChange={setAudioBitrate}
              onResetDefaults={resetDefaults}
              onClose={handleClosePanel}
            />
          )}
          {isPanelVisible && panel.panel === 'console' && (
            <ConsoleDrawer logs={debugLogs} onClose={handleClosePanel} />
          )}
        </div>
      </div>
    </div>
  );
}
