import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ProcessingFile } from '../App';

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
  const processFile = useCallback(
    async (file: ProcessingFile) => {
      onFileUpdate(file.id, { status: 'processing', progress: 0 });

      addLog?.(`⏳ Processing: ${file.name} (${file.type})`);

      const unlisten = await listen<{ file_id: string; progress: number }>(
        'ffmpeg-progress',
        (event) => {
          if (event.payload.file_id === file.id) {
            onFileUpdate(file.id, { progress: event.payload.progress });
          }
        }
      );

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
      } finally {
        unlisten();
      }
    },
    [onFileUpdate, imageQuality, videoCRF, audioBitrate, addLog]
  );

  return { processFile };
}
