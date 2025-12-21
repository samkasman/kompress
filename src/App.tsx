import { useState } from 'react';
import DropZone from './components/DropZone';
import { FileInfo } from './utils/fileUtils';

export type FileStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface ProcessingFile extends FileInfo {
  id: string;
  status: FileStatus;
  progress: number;
  outputPath?: string;
  error?: string;
}

function App() {
  const [files, setFiles] = useState<ProcessingFile[]>([]);

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
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50">
        <h1 className="text-2xl font-bold text-slate-100 leading-none">SK</h1>
      </div>
      <DropZone
        files={files}
        onFilesAdded={handleFilesAdded}
        onFileUpdate={handleFileUpdate}
      />
    </div>
  );
}

export default App;
