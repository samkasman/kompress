export type FileType = 'image' | 'video' | 'unknown';

export interface FileInfo {
  path: string;
  name: string;
  type: FileType;
  size: number;
}

export function getFileType(filePath: string): FileType {
  const ext = filePath.toLowerCase().split('.').pop();
  if (!ext) return 'unknown';

  const imageExts = ['png', 'jpg', 'jpeg'];
  const videoExts = ['mov', 'mp4'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'unknown';
}

export function isValidFileType(filePath: string): boolean {
  return getFileType(filePath) !== 'unknown';
}

export function getOutputPath(inputPath: string): string {
  const pathParts = inputPath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  const ext = getFileType(inputPath) === 'image' ? 'jpg' : 'mp4';
  const dir = pathParts.slice(0, -1).join('/');
  return `${dir}/${nameWithoutExt}-compressed.${ext}`;
}
