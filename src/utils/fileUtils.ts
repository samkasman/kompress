import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FileType = 'image' | 'video' | 'audio' | 'unknown';

export interface FileInfo {
  path: string;
  name: string;
  type: FileType;
  size: number;
}

export function getFileType(filePath: string): FileType {
  const ext = filePath.toLowerCase().split('.').pop();
  if (!ext) return 'unknown';

  const imageExts = ['png', 'jpg', 'jpeg', 'heic', 'webp'];
  const videoExts = ['mov', 'mp4', 'mkv'];
  const audioExts = ['wav', 'mp3', 'aac', 'flac', 'm4a', 'ogg', 'wma'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'unknown';
}

export function isValidFileType(filePath: string): boolean {
  return getFileType(filePath) !== 'unknown';
}

export function getOutputPath(inputPath: string): string {
  const pathParts = inputPath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  const fileType = getFileType(inputPath);
  const ext =
    fileType === 'image' ? 'jpg' : fileType === 'audio' ? 'mp3' : 'mp4';
  const dir = pathParts.slice(0, -1).join('/');
  return `${dir}/${nameWithoutExt}-compressed.${ext}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
