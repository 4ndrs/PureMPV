import type { Options, Box } from "./types";

const options: Options = {
  copy_mode: "ffmpeg",
  pure_mode: true,
  pure_webm: false,
  ffmpeg_params: "",
  purewebm_extra_params: "",
  input_seeking: true,
  selection: "primary",
  copy_utility: "detect",
  hide_osc_on_crop: false,
};

const purewebm = { burnSubs: false };
const timestamps: { start?: string; end?: string } = {};

const cropBox: Box = {
  isCropping: false,
  toString() {
    return typeof this.w === "number" && typeof this.h === "number"
      ? `${cropBox.w}:${cropBox.h}:${cropBox.x}:${cropBox.y}`
      : "";
  },
};

const PureMPV = { options, timestamps, purewebm, cropBox };

export default PureMPV;
