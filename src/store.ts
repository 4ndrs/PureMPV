import type { Options } from "./types";

const options: Options = {
  copy_mode: "ffmpeg",
  pure_mode: true,
  pure_box: false,
  pure_webm: false,
  ffmpeg_params: "",
  purewebm_extra_params: "",
  input_seeking: true,
  selection: "primary",
  copy_utility: "detect",
  hide_osc_on_crop: false,
};

const timestamps: { start?: string; end?: string } = {};

const purempv = { options, timestamps };

export default purempv;
