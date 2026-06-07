import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';

const STORAGE_KEY = 'kompress:settings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hydrates defaults when localStorage is empty', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      imageQuality: 6,
      videoCRF: 22,
      audioBitrate: 320,
    });
  });

  it('restores valid values from localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ imageQuality: 4, videoCRF: 25, audioBitrate: 192 })
    );
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      imageQuality: 4,
      videoCRF: 25,
      audioBitrate: 192,
    });
  });

  it('clamps out-of-range stored values back to defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ imageQuality: 99, videoCRF: 0, audioBitrate: 999 })
    );
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      imageQuality: 6,
      videoCRF: 22,
      audioBitrate: 320,
    });
  });

  it('ignores malformed JSON in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.imageQuality).toBe(6);
  });

  it('persists setter writes to localStorage and clamps invalid input', () => {
    const { result } = renderHook(() => useSettings());

    act(() => result.current.setImageQuality(3));
    expect(result.current.settings.imageQuality).toBe(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).imageQuality).toBe(3);

    // Out-of-range value falls back to the default.
    act(() => result.current.setImageQuality(50));
    expect(result.current.settings.imageQuality).toBe(6);
  });

  it('resetDefaults restores every value', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setImageQuality(2);
      result.current.setVideoCRF(28);
      result.current.setAudioBitrate(128);
    });

    act(() => result.current.resetDefaults());

    expect(result.current.settings).toEqual({
      imageQuality: 6,
      videoCRF: 22,
      audioBitrate: 320,
    });
  });
});
