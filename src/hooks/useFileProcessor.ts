import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ProcessingFile } from '../App';

export function useFileProcessor() {
  const processFile = useCallback(
    async (
      file: ProcessingFile,
      onProgress: (id: string, progress: number) => void,
      onComplete: (id: string, outputPath: string) => void,
      onError: (id: string, error: string) => void
    ): Promise<void> => {
      try {
        if (file.type === 'image') {
          onProgress(file.id, 50);
        }

        const outputPath = await invoke<string>('compress_file', {
          inputPath: file.path,
          fileType: file.type,
        });

        onComplete(file.id, outputPath);
      } catch (error) {
        const errorMessage =
          typeof error === 'string'
            ? error
            : error instanceof Error
              ? error.message
              : 'Unknown error occurred';
        console.error('Compression error:', error);
        onError(file.id, errorMessage);
      }
    },
    []
  );

  return { processFile };
}
