import type { Options, Box } from "./types";

const options: Options = {
  executable: "ffmpeg",
  pure_mode: true,
  ffmpeg_params: "",
  input_seeking: true,
  selection: "primary",
  copy_utility: "detect",
  hide_osc_on_crop: false,

  key_crop: "c",
  key_preview: "ctrl+shift+w",
  key_pure_mode: "ctrl+p",
  key_file_path: "ctrl+w",
  key_timestamp: "ctrl+e",
  key_timestamp_end: "ctrl+shift+e",
};

const getKeys = () => ({
  crop: options.key_crop,
  preview: options.key_preview,
  mode: options.key_pure_mode,
  path: options.key_file_path,
  time: options.key_timestamp,
  timeEnd: options.key_timestamp_end,
});

const timestamps: { start?: string; end?: string } = {};

const cropBox: Box = {
  isCropping: false,
  toString() {
    return typeof this.w === "number" && typeof this.h === "number"
      ? `${cropBox.w}:${cropBox.h}:${cropBox.x}:${cropBox.y}`
      : "";
  },
};

const PureMPV = { options, getKeys, timestamps, cropBox };

export default PureMPV;
