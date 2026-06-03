import type { SupportedFileType } from '@/constants/formats';

export interface FfmpegOutput {
  file_id: string;
  line: string;
}

export interface FfmpegProgress {
  file_id: string;
  progress: number;
}

export interface CompressResult {
  output_path: string;
  output_size: number;
}

export interface CompressFileArgs {
  inputPath: string;
  fileType: SupportedFileType;
  fileId: string;
  imageQuality?: number;
  videoCRF?: number;
  audioBitrate?: number;
}
