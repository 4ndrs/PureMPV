export interface Options {
  copy_mode: CopyMode;
  pure_mode: boolean;
  pure_webm: boolean;
  ffmpeg_params: string;
  purewebm_extra_params: string;
  input_seeking: boolean;
  selection: Selection;
  copy_utility: CopyUtility;
  hide_osc_on_crop: boolean;
  [id: string]: string | number | boolean;
}

export interface Box {
  constX?: number;
  constY?: number;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  isCropping: boolean;
  toString: () => string;
}

export type Selection = "primary" | "clipboard";
export type CopyUtility = "detect" | "xclip" | "wl-copy";
export type CopyMode = "ffmpeg" | "purewebm";
