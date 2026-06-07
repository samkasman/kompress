import { describe, it, expect } from 'vitest';
import { getFileType, isValidFileType, formatFileSize } from './fileUtils';

describe('getFileType', () => {
  it('classifies images, videos, and audio by extension', () => {
    expect(getFileType('/x/y/photo.png')).toBe('image');
    expect(getFileType('photo.HEIC')).toBe('image');
    expect(getFileType('clip.mov')).toBe('video');
    expect(getFileType('song.flac')).toBe('audio');
  });

  it('returns "unknown" for unsupported types and missing extensions', () => {
    expect(getFileType('/path/to/notes.txt')).toBe('unknown');
    expect(getFileType('extensionless')).toBe('unknown');
  });

  it('handles Windows-style paths', () => {
    expect(getFileType('C:\\Users\\me\\clip.mp4')).toBe('video');
  });
});

describe('isValidFileType', () => {
  it('is true for any supported type and false otherwise', () => {
    expect(isValidFileType('a.mp3')).toBe(true);
    expect(isValidFileType('a.exe')).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('renders bytes, KB, MB across boundaries', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
