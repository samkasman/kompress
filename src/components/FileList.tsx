import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { ProcessingFile } from '../App';
import { formatFileSize } from '../utils/fileUtils';
import { invoke } from '@tauri-apps/api/core';
import { X, CheckCircle, AlertCircle, FolderOpen, File } from 'lucide-react';
import { useFileProcessor } from '../hooks/useFileProcessor';

interface FileListProps {
  files: ProcessingFile[];
  onFileUpdate: (id: string, updates: Partial<ProcessingFile>) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

export default function FileList({
  files,
  onFileUpdate,
  onRemoveFile,
  onClearAll,
}: FileListProps) {
  const { processFile } = useFileProcessor();

  useEffect(() => {
    files.forEach((file) => {
      if (file.status === 'pending') {
        handleProcessFile(file);
      }
    });
  }, [files]);

  const handleProcessFile = async (file: ProcessingFile) => {
    onFileUpdate(file.id, { status: 'processing', progress: 0 });

    await processFile(
      file,
      (id, progress) => {
        onFileUpdate(id, { progress });
      },
      (id, outputPath) => {
        onFileUpdate(id, {
          status: 'complete',
          progress: 100,
          outputPath,
        });
      },
      (id, error) => {
        onFileUpdate(id, {
          status: 'error',
          error,
        });
      }
    );
  };

  const getStatusBadge = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'complete':
        return <Badge variant="success">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const handleOpenFile = async (filePath: string) => {
    await invoke('open_file', { path: filePath });
  };

  const handleRevealInFolder = async (filePath: string) => {
    await invoke('reveal_in_folder', { path: filePath });
  };

  if (files.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-3 p-4 pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-1 -right-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          onClick={onClearAll}
        >
          <X className="h-5 w-5" />
        </Button>
        {files.map((file) => (
          <Card
            key={file.id}
            className="bg-slate-900/95 border-slate-700 shadow-2xl backdrop-blur-sm"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-slate-400" />
                  <div>
                    <CardTitle className="text-lg text-slate-100">
                      {file.name}
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(file.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                    onClick={() => onRemoveFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {file.status === 'processing' && (
                <div className="space-y-2">
                  <Progress value={file.progress} />
                  <p className="text-xs text-slate-400 text-center">
                    {file.progress}% complete
                  </p>
                </div>
              )}

              {file.status === 'complete' && file.outputPath && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Compression complete!</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                      onClick={() => handleOpenFile(file.outputPath!)}
                    >
                      <File className="h-4 w-4 mr-2" />
                      Open File
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                      onClick={() => handleRevealInFolder(file.outputPath!)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Reveal in Folder
                    </Button>
                  </div>
                </div>
              )}

              {file.status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{file.error || 'An error occurred'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
