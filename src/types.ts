export interface Options {
  executable: string;
  pure_mode: boolean;
  ffmpeg_params: string;
  input_seeking: boolean;
  selection: "primary" | "clipboard";
  copy_utility: "detect" | "xclip" | "wl-copy";
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
