import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ProcessingFile } from '@/App';
import type { CompressResult, FfmpegProgress } from '@/types/ipc';

interface UseFileProcessorOptions {
  imageQuality: number;
  videoCRF: number;
  audioBitrate: number;
  onFileUpdate: (id: string, updates: Partial<ProcessingFile>) => void;
  addLog?: (message: string) => void;
}

export function useFileProcessor({
  imageQuality,
  videoCRF,
  audioBitrate,
  onFileUpdate,
  addLog,
}: UseFileProcessorOptions) {
  // Refs keep the single global progress listener (mounted once) reading the
  // most recent callbacks without resubscribing on every render.
  const onFileUpdateRef = useRef(onFileUpdate);
  const addLogRef = useRef(addLog);
  onFileUpdateRef.current = onFileUpdate;
  addLogRef.current = addLog;

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    listen<FfmpegProgress>('ffmpeg-progress', (event) => {
      onFileUpdateRef.current(event.payload.file_id, {
        progress: event.payload.progress,
      });
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => {
        addLogRef.current?.(
          `❌ Failed to subscribe to ffmpeg-progress: ${err}`
        );
        console.error('listen(ffmpeg-progress) rejected:', err);
      });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  const processFile = useCallback(
    async (file: ProcessingFile) => {
      onFileUpdate(file.id, { status: 'processing', progress: 0 });
      addLog?.(`⏳ Processing: ${file.name} (${file.type})`);

      try {
        const result = await invoke<CompressResult>('compress_file', {
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
        addLog?.(`✅ Complete: ${file.name} (${savedPercent}% saved)`);

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
        addLog?.(`❌ Error: ${file.name} - ${errorMessage}`);
        onFileUpdate(file.id, { status: 'error', error: errorMessage });
      }
    },
    [onFileUpdate, imageQuality, videoCRF, audioBitrate, addLog]
  );

  return { processFile };
}
