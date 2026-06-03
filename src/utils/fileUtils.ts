import { FORMATS, type SupportedFileType } from '@/constants/formats';

export type FileType = SupportedFileType | 'unknown';

export interface FileInfo {
  path: string;
  name: string;
  type: FileType;
  size: number;
}

export function getFileType(filePath: string): FileType {
  const ext = filePath.toLowerCase().split('.').pop();
  if (!ext) return 'unknown';
  for (const group of Object.values(FORMATS)) {
    if (group.inputExts.includes(ext)) return group.type;
  }
  return 'unknown';
}

export function isValidFileType(filePath: string): boolean {
  return getFileType(filePath) !== 'unknown';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
