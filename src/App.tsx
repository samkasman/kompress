import { useState, useEffect } from 'react';
import DropZone from '@/components/DropZone';
import { FileInfo } from '@/utils/fileUtils';

export type FileStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface ProcessingFile extends FileInfo {
  id: string;
  status: FileStatus;
  progress: number;
  outputPath?: string;
  outputSize?: number;
  error?: string;
}

// Splash animation timing — header fades in first, then the main content
// crossfades a moment later.
const SPLASH_HEADER_DELAY_MS = 100;
const SPLASH_CONTENT_DELAY_MS = 700;

function App() {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [showSK, setShowSK] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const headerTimer = setTimeout(
      () => setShowSK(true),
      SPLASH_HEADER_DELAY_MS
    );
    const contentTimer = setTimeout(
      () => setShowContent(true),
      SPLASH_CONTENT_DELAY_MS
    );

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  const handleFilesAdded = (newFiles: FileInfo[]) => {
    const processingFiles: ProcessingFile[] = newFiles.map((file) => ({
      ...file,
      id: crypto.randomUUID(),
      status: 'pending' as FileStatus,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...processingFiles]);
  };

  const handleFileUpdate = (id: string, updates: Partial<ProcessingFile>) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
    );
  };

  return (
    <div className="min-h-screen relative z-10">
      <div
        className={`relative z-10 transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <DropZone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileUpdate={handleFileUpdate}
          showSK={showSK}
        />
      </div>
    </div>
  );
}

export default App;
