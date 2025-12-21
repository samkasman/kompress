import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface UseDragAndDropOptions {
  onFilesDropped: (paths: string[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  addLog?: (message: string) => void;
  showDrawer?: boolean;
}

export function useDragAndDrop({
  onFilesDropped,
  onDragStateChange,
  addLog,
  showDrawer = false,
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

    const setupFileDrop = async () => {
      try {
        const appWindow = getCurrentWindow();

        unlisten = await appWindow.onDragDropEvent((event) => {
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

            if (paths.length > 0 && !showDrawer) {
              onFilesDropped(paths);
            }

            setTimeout(() => {
              isProcessingDrop.current = false;
            }, 500);
          } else if (event.payload.type === 'leave') {
            handleDragStateChange(false);
          }
        });
      } catch (error) {
        const errorMsg = `❌ Failed to set up drag-drop listener: ${error}`;
        addLog?.(errorMsg);
        console.error(errorMsg, error);
      }
    };

    setupFileDrop();

    return () => {
      if (unlisten) unlisten();
    };
  }, [onFilesDropped, showDrawer, handleDragStateChange, addLog]);

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
