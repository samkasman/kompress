export type SupportedFileType = 'image' | 'video' | 'audio';

interface FormatGroup {
  type: SupportedFileType;
  inputExts: readonly string[];
  outputExt: string;
  label: string;
}

export const FORMATS: Record<SupportedFileType, FormatGroup> = {
  image: {
    type: 'image',
    inputExts: ['png', 'jpg', 'jpeg', 'heic', 'webp'],
    outputExt: 'jpg',
    label: 'Image',
  },
  video: {
    type: 'video',
    inputExts: ['mov', 'mp4', 'mkv'],
    outputExt: 'mp4',
    label: 'Video',
  },
  audio: {
    type: 'audio',
    inputExts: ['wav', 'mp3', 'aac', 'flac', 'm4a', 'ogg', 'wma'],
    outputExt: 'mp3',
    label: 'Audio',
  },
};

export const ALL_INPUT_EXTS: readonly string[] = Object.values(FORMATS).flatMap(
  (g) => g.inputExts
);

export function formatExtList(type: SupportedFileType): string {
  return FORMATS[type].inputExts.map((e) => e.toUpperCase()).join(', ');
}

export function formatConversionLabel(type: SupportedFileType): string {
  const { inputExts, outputExt } = FORMATS[type];
  return `${inputExts.map((e) => e.toUpperCase()).join('/')} → ${outputExt.toUpperCase()}`;
}
