export interface Options {
  executable: string;
  pure_mode: boolean;
  ffmpeg_params: string;
  input_seeking: boolean;
  selection: "primary" | "clipboard";
  copy_utility: "detect" | "xclip" | "wl-copy" | "pbcopy";
  hide_osc_on_crop: boolean;
  box_color: string;

  key_crop: string;
  key_preview: string;
  key_pure_mode: string;
  key_file_path: string;
  key_timestamp: string;
  key_timestamp_end: string;
  [id: string]: string | number | boolean;
}

export interface Box {
  constX?: number;
  constY?: number;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  color: string;
  isCropping: boolean;
  toString: () => string;
}
