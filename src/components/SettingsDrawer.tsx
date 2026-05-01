import { X } from 'lucide-react';
import { WindowsXPShell32Icon274 } from 'react-old-icons';

interface SettingsDrawerProps {
  imageQuality: number;
  videoCRF: number;
  audioBitrate: number;
  onImageQualityChange: (value: number) => void;
  onVideoCRFChange: (value: number) => void;
  onAudioBitrateChange: (value: number) => void;
  onClose: () => void;
}

export default function SettingsDrawer({
  imageQuality,
  videoCRF,
  audioBitrate,
  onImageQualityChange,
  onVideoCRFChange,
  onAudioBitrateChange,
  onClose,
}: SettingsDrawerProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WindowsXPShell32Icon274
            size={20}
            className="text-slate-100"
            alt="Settings"
          />
          <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
        </div>
        <button
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-slate-950/50 rounded-lg p-3 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-200">Image</p>
            <p className="text-xs text-slate-400">PNG/JPG/HEIC/WEBP → JPG</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="image-quality" className="text-xs text-slate-400">
                Quality:
              </label>
              <span className="text-xs text-slate-300">{imageQuality}</span>
            </div>
            <input
              type="range"
              id="image-quality"
              min={1}
              max={8}
              step={1}
              value={imageQuality}
              onChange={(e) => onImageQualityChange(Number(e.target.value))}
              style={{ transform: 'scaleX(-1)' }}
              className="w-full appearance-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>8 (Smallest)</span>
              <span>1 (Best)</span>
            </div>
          </div>
        </div>
        <hr className="border-slate-700" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-200">Video</p>
            <p className="text-xs text-slate-400">MOV/MP4/MKV → MP4</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="video-crf" className="text-xs text-slate-400">
                CRF:
              </label>
              <span className="text-xs text-slate-300">{videoCRF}</span>
            </div>
            <input
              type="range"
              id="video-crf"
              min={18}
              max={28}
              step={1}
              value={videoCRF}
              onChange={(e) => onVideoCRFChange(Number(e.target.value))}
              style={{ transform: 'scaleX(-1)' }}
              className="w-full appearance-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>28 (Smallest)</span>
              <span>18 (Best)</span>
            </div>
          </div>
        </div>
        <hr className="border-slate-700" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-200">Audio</p>
            <p className="text-xs text-slate-400">WAV/MP3 → MP3</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="audio-bitrate" className="text-xs text-slate-400">
                Bitrate:
              </label>
              <span className="text-xs text-slate-300">
                {audioBitrate} kbps
              </span>
            </div>
            <input
              type="range"
              id="audio-bitrate"
              min={128}
              max={320}
              step={64}
              value={audioBitrate}
              onChange={(e) => onAudioBitrateChange(Number(e.target.value))}
              className="w-full appearance-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>128 kbps (Smallest)</span>
              <span>320 kbps (Best)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
