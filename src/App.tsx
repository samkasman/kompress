import { useState, useEffect } from 'react';
import DropZone from './components/DropZone';
import { FileInfo } from './utils/fileUtils';

export type FileStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface ProcessingFile extends FileInfo {
  id: string;
  status: FileStatus;
  progress: number;
  outputPath?: string;
  outputSize?: number;
  error?: string;
}

function App() {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [showSK, setShowSK] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // SK fades in first (starts after 0.1s)
    const timer1 = setTimeout(() => {
      setShowSK(true);
    }, 100);

    // Content fades in after SK finishes (0.6s after SK starts = 0.7s total)
    const timer2 = setTimeout(() => {
      setShowContent(true);
    }, 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleFilesAdded = (newFiles: FileInfo[]) => {
    const processingFiles: ProcessingFile[] = newFiles.map((file) => ({
      ...file,
      id: `${file.path}-${Date.now()}-${Math.random()}`,
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
      {/* SK Logo - top-left, fades in first */}
      <h1
        className={`fixed top-4 left-4 text-2xl font-bold text-slate-100 leading-none z-50 transition-opacity duration-500 ${
          showSK ? 'opacity-100' : 'opacity-0'
        }`}
      >
        SK
      </h1>

      {/* Main Content */}
      <div
        className={`relative z-10 transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <DropZone
          files={files}
          onFilesAdded={handleFilesAdded}
          onFileUpdate={handleFileUpdate}
        />
      </div>
    </div>
  );
}

export default App;
