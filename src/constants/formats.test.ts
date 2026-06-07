import { describe, it, expect } from 'vitest';
import {
  FORMATS,
  ALL_INPUT_EXTS,
  formatExtList,
  formatConversionLabel,
} from './formats';

describe('FORMATS registry', () => {
  it('uses outputExt that matches Rust compress_file output extensions', () => {
    expect(FORMATS.image.outputExt).toBe('jpg');
    expect(FORMATS.video.outputExt).toBe('mp4');
    expect(FORMATS.audio.outputExt).toBe('mp3');
  });

  it('covers every claimed input extension once', () => {
    const all = Object.values(FORMATS).flatMap((g) => g.inputExts);
    const unique = new Set(all);
    expect(all.length).toBe(unique.size);
  });
});

describe('ALL_INPUT_EXTS', () => {
  it('contains every input extension across categories', () => {
    expect(ALL_INPUT_EXTS).toContain('heic');
    expect(ALL_INPUT_EXTS).toContain('webp');
    expect(ALL_INPUT_EXTS).toContain('mkv');
    expect(ALL_INPUT_EXTS).toContain('wma');
  });
});

describe('formatExtList', () => {
  it('produces an upper-case comma-joined list', () => {
    expect(formatExtList('video')).toBe('MOV, MP4, MKV');
  });
});

describe('formatConversionLabel', () => {
  it('formats as "A/B/C → OUT"', () => {
    expect(formatConversionLabel('image')).toBe('PNG/JPG/JPEG/HEIC/WEBP → JPG');
    expect(formatConversionLabel('audio')).toBe(
      'WAV/MP3/AAC/FLAC/M4A/OGG/WMA → MP3'
    );
  });
});
