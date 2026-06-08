import { memo, type ReactNode } from 'react';
import { RotateCcw, Settings } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { IconButton } from '@/components/ui/icon-button';
import { formatConversionLabel } from '@/constants/formats';

interface SettingsDrawerProps {
  imageQuality: number;
  videoCRF: number;
  audioBitrate: number;
  onImageQualityChange: (value: number) => void;
  onVideoCRFChange: (value: number) => void;
  onAudioBitrateChange: (value: number) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

function SettingsDrawer({
  imageQuality,
  videoCRF,
  audioBitrate,
  onImageQualityChange,
  onVideoCRFChange,
  onAudioBitrateChange,
  onResetDefaults,
  onClose,
}: SettingsDrawerProps) {
  return (
    <Drawer
      icon={Settings}
      title="Settings"
      onClose={onClose}
      headerAction={
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Reset to defaults"
          title="Reset to defaults"
          onClick={onResetDefaults}
        >
          <RotateCcw className="h-4 w-4" />
        </IconButton>
      }
    >
      <div className="space-y-5">
        <Group name="Image" subtitle={formatConversionLabel('image')}>
          <Slider
            id="image-quality"
            label="Quality"
            value={imageQuality}
            min={1}
            max={8}
            minLabel="Best"
            maxLabel="Smallest"
            onChange={onImageQualityChange}
          />
        </Group>
        <hr className="border-border" />
        <Group name="Video" subtitle={formatConversionLabel('video')}>
          <Slider
            id="video-crf"
            label="CRF"
            value={videoCRF}
            min={18}
            max={28}
            minLabel="Best"
            maxLabel="Smallest"
            onChange={onVideoCRFChange}
          />
        </Group>
        <hr className="border-border" />
        <Group name="Audio" subtitle={formatConversionLabel('audio')}>
          <Slider
            id="audio-bitrate"
            label="Bitrate"
            value={audioBitrate}
            min={128}
            max={320}
            step={64}
            valueLabel={`${audioBitrate} kbps`}
            minLabel="Smallest"
            maxLabel="Best"
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
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
          {name}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

export default memo(SettingsDrawer);
