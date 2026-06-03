import { useEffect, useState } from 'react';

interface Settings {
  imageQuality: number;
  videoCRF: number;
  audioBitrate: number;
}

const DEFAULT_SETTINGS: Settings = {
  imageQuality: 6,
  videoCRF: 22,
  audioBitrate: 320,
};

const STORAGE_KEY = 'kompress:settings';

const RANGES = {
  imageQuality: { min: 1, max: 8 },
  videoCRF: { min: 18, max: 28 },
  audioBitrate: { min: 128, max: 320 },
} as const;

function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  return typeof value === 'number' && value >= min && value <= max ? value : fallback;
}

function loadFromStorage(): Settings {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    const parsed: Partial<Settings> = JSON.parse(saved);
    return {
      imageQuality: clamp(parsed.imageQuality, RANGES.imageQuality, DEFAULT_SETTINGS.imageQuality),
      videoCRF: clamp(parsed.videoCRF, RANGES.videoCRF, DEFAULT_SETTINGS.videoCRF),
      audioBitrate: clamp(parsed.audioBitrate, RANGES.audioBitrate, DEFAULT_SETTINGS.audioBitrate),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (key: keyof Settings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: clamp(value, RANGES[key], DEFAULT_SETTINGS[key]),
    }));
  };

  return {
    settings,
    setImageQuality: (value: number) => update('imageQuality', value),
    setVideoCRF: (value: number) => update('videoCRF', value),
    setAudioBitrate: (value: number) => update('audioBitrate', value),
    resetDefaults: () => setSettings(DEFAULT_SETTINGS),
  };
}
