import type { Options, Box } from "./types";

const options: Options = {
  executable: "ffmpeg",
  pure_mode: true,
  ffmpeg_params: "",
  input_seeking: true,
  selection: "primary",
  copy_utility: "detect",
  hide_osc_on_crop: false,
  box_color: "#FF1493",

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

const setBoxColor = () => {
  const color = PureMPV.options.box_color.toUpperCase();
  const isValidHexColor = /^#[0-9A-F]{6}$/.test(color);

  if (!isValidHexColor) {
    mp.msg.warn(`Invalid hex color: ${color}`);

    const deepPink = "9314FF"; // #FF1493

    PureMPV.cropBox.color = deepPink;

    return;
  }

  const rgb = color.slice(1);

  const red = `${rgb[0]}${rgb[1]}`;
  const green = `${rgb[2]}${rgb[3]}`;
  const blue = `${rgb[4]}${rgb[5]}`;

  const bgr = blue + green + red;

  PureMPV.cropBox.color = bgr;
};

const timestamps: { start?: string; end?: string } = {};

const cropBox: Box = {
  isCropping: false,
  color: "9314FF",
  toString() {
    return typeof this.w === "number" && typeof this.h === "number"
      ? `${cropBox.w}:${cropBox.h}:${cropBox.x}:${cropBox.y}`
      : "";
  },
};

const PureMPV = { options, getKeys, setBoxColor, timestamps, cropBox };

export default PureMPV;
