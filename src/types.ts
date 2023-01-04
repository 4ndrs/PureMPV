export interface Options {
  copy_mode: CopyMode;
  pure_mode: boolean;
  pure_box: boolean;
  pure_webm: boolean;
  ffmpeg_params: string;
  purewebm_extra_params: string;
  input_seeking: boolean;
  selection: Selection;
  copy_utility: CopyUtility;
  [id: string]: string | number | boolean;
}

export interface MousePos {
  x: number;
  y: number;
}

export interface Box {
  constX: number | null;
  constY: number | null;
  w: number | null;
  h: number | null;
  x: number | null;
  y: number | null;
}

export interface SetBox {
  constX: number;
  constY: number;
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface OSDSize {
  width: number;
  height: number;
}

export type Selection = "primary" | "clipboard";
export type CopyUtility = "detect" | "xclip" | "wl-copy";
export type CopyMode = "ffmpeg" | "purewebm";
