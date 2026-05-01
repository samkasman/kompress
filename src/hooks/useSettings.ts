import { useState, useEffect } from 'react';

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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          imageQuality:
            parsed.imageQuality >= 1 && parsed.imageQuality <= 8
              ? parsed.imageQuality
              : DEFAULT_SETTINGS.imageQuality,
          videoCRF:
            parsed.videoCRF >= 18 && parsed.videoCRF <= 28
              ? parsed.videoCRF
              : DEFAULT_SETTINGS.videoCRF,
          audioBitrate:
            parsed.audioBitrate >= 128 && parsed.audioBitrate <= 320
              ? parsed.audioBitrate
              : DEFAULT_SETTINGS.audioBitrate,
        });
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return {
    settings,
    setImageQuality: (value: number) => updateSettings({ imageQuality: value }),
    setVideoCRF: (value: number) => updateSettings({ videoCRF: value }),
    setAudioBitrate: (value: number) => updateSettings({ audioBitrate: value }),
  };
}
