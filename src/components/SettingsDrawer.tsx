import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { formatConversionLabel } from '@/constants/formats';

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
    <Drawer icon={Settings} title="Settings" onClose={onClose}>
      <div className="bg-slate-950/50 rounded-lg p-3 space-y-6">
        <Group name="Image" subtitle={formatConversionLabel('image')}>
          <Slider
            id="image-quality"
            label="Quality"
            value={imageQuality}
            min={1}
            max={8}
            minLabel="1 (Best)"
            maxLabel="8 (Smallest)"
            onChange={onImageQualityChange}
          />
        </Group>
        <hr className="border-slate-700" />
        <Group name="Video" subtitle={formatConversionLabel('video')}>
          <Slider
            id="video-crf"
            label="CRF"
            value={videoCRF}
            min={18}
            max={28}
            minLabel="18 (Best)"
            maxLabel="28 (Smallest)"
            onChange={onVideoCRFChange}
          />
        </Group>
        <hr className="border-slate-700" />
        <Group name="Audio" subtitle={formatConversionLabel('audio')}>
          <Slider
            id="audio-bitrate"
            label="Bitrate"
            value={audioBitrate}
            min={128}
            max={320}
            step={64}
            valueLabel={`${audioBitrate} kbps`}
            minLabel="128 kbps (Smallest)"
            maxLabel="320 kbps (Best)"
            onChange={onAudioBitrateChange}
          />
        </Group>
      </div>
    </Drawer>
  );
}

function Group({
  name,
  subtitle,
  children,
}: {
  name: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-200">{name}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
