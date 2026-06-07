import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface UseDragAndDropOptions {
  onFilesDropped: (paths: string[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  addLog?: (message: string) => void;
  /**
   * If true, a drawer is open and is covering the drop zone. When a drop
   * arrives we call `onDrawerClose` first (so the drawer slides away) and
   * then forward the drop normally — instead of silently dropping it.
   */
  showDrawer?: boolean;
  onDrawerClose?: () => void;
}

export function useDragAndDrop({
  onFilesDropped,
  onDragStateChange,
  addLog,
  showDrawer = false,
  onDrawerClose,
}: UseDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const isProcessingDrop = useRef(false);

  const handleDragStateChange = useCallback(
    (dragging: boolean) => {
      setIsDragging(dragging);
      onDragStateChange?.(dragging);
    },
    [onDragStateChange]
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const setupFileDrop = async () => {
      try {
        const appWindow = getCurrentWindow();

        const fn = await appWindow.onDragDropEvent((event) => {
          if (event.payload.type === 'enter' || event.payload.type === 'over') {
            handleDragStateChange(true);
          } else if (event.payload.type === 'drop') {
            handleDragStateChange(false);

            if (isProcessingDrop.current) {
              return;
            }

            isProcessingDrop.current = true;
            const paths = event.payload.paths;
            addLog?.(`Dropped ${paths.length} file(s): ${paths.join(', ')}`);

            if (paths.length > 0) {
              if (showDrawer) onDrawerClose?.();
              onFilesDropped(paths);
            }

            setTimeout(() => {
              isProcessingDrop.current = false;
            }, 500);
          } else if (event.payload.type === 'leave') {
            handleDragStateChange(false);
          }
        });

        // StrictMode (or any rapid effect re-run) can fire the cleanup before
        // this promise resolves. If that happened, tear down the listener now
        // — otherwise it leaks for the lifetime of the window.
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      } catch (error) {
        const errorMsg = `❌ Failed to set up drag-drop listener: ${error}`;
        addLog?.(errorMsg);
        console.error(errorMsg, error);
      }
    };

    setupFileDrop();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [
    onFilesDropped,
    showDrawer,
    onDrawerClose,
    handleDragStateChange,
    addLog,
  ]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]')) return;

      if (!isDragging) {
        handleDragStateChange(true);
        addLog?.('Drag over detected');
      }
    },
    [isDragging, handleDragStateChange, addLog]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]')) return;

      handleDragStateChange(true);
      addLog?.('🎯 Drag enter detected!');
    },
    [handleDragStateChange, addLog]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === e.target) {
        handleDragStateChange(false);
      }
    },
    [handleDragStateChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleDragStateChange(false);
      addLog?.('HTML5 drop event (Tauri handles files)');
    },
    [handleDragStateChange, addLog]
  );

  return {
    isDragging,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
