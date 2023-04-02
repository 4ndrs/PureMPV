import { getStreamUrls } from "./streams";
import { printMessage } from "./utils";
import { boxIsSet } from "./cropbox";

import PureMPV from "./purempv";

import type { Box } from "./types";

const preview = () => {
  printMessage("Processing preview");

  const path = mp.get_property("path");

  if (typeof path !== "string") {
    throw new Error("Unable to get the path");
  }

  const muteAudio = mp.get_property("mute") === "yes" ? "-an" : "";

  const params =
    `${muteAudio} -map_metadata -1 -map_chapters -1 -f matroska ` +
    "-c:v libx264 -preset ultrafast - | mpv - --loop";

  const { inputs, cropLavfi } = serialize(
    path,
    PureMPV.cropBox,
    false,
    true,
    PureMPV.timestamps.start,
    PureMPV.timestamps.end
  );

  const mappings = inputs.map(
    (_input, index) => `-map ${index}:v? -map ${index}:a?`
  );

  const command = `ffmpeg -hide_banner ${inputs.join(" ")} ${mappings.join(
    " "
  )} ${cropLavfi} ${params}`;

  mp.commandv("run", "bash", "-c", `(${command})`);
};

const serialize = (
  path: string,
  cropBox: Box,
  pureWebmMode: boolean,
  inputSeeking: boolean,
  startTime?: string,
  endTime?: string
) => {
  const timestamps = serializeTimestamps(startTime, endTime);
  const inputs = serializeInputs(path, timestamps, pureWebmMode, inputSeeking);
  const cropLavfi = boxIsSet(cropBox) ? serializeCropBox(cropBox) : "";

  return {
    inputs: inputs,
    cropLavfi: cropLavfi,
  };
};

const generateCommand = (inputs: string[]) => {
  const program = PureMPV.options.executable;
  const params = PureMPV.options.ffmpeg_params;

  const cropLavfi = serializeCropBox(PureMPV.cropBox);

  return `${program} ${inputs.join(" ")} ${cropLavfi} ${params}`.trim();
};

const serializeTimestamps = (start?: string, end?: string) =>
  `${start ? "-ss " + start : ""}${
    end ? (start ? " " : "") + "-to " + end : ""
  }`;

const serializeInputs = (
  path: string,
  timestamps: string,
  subProcessMode: boolean,
  inputSeeking: boolean
) => {
  // Note: in subprocess mode this function returns an array of inputs adapted
  // for running as subprocess's args, if it is off, each item will be pushed as
  // a single string with quoted input paths. The following is an example of a single item
  // with inputSeeking=true and subProcessMode=false:
  // '-ss start time -to stop time -i "input/file/path"'
  const isStream = path.search("^http[s]?://") !== -1;

  if (!timestamps && !isStream) {
    return subProcessMode ? ["-i", `${path}`] : [`-i "${path}"`];
  }

  if (!isStream) {
    return subProcessMode
      ? [...timestamps.split(" "), "-i", `${path}`]
      : inputSeeking
      ? [`${timestamps} -i "${path}"`]
      : [`-i "${path}" ${timestamps}`];
  }

  const urls = getStreamUrls(path);
  const inputs = [];

  if (!urls) {
    throw new Error(
      "ERROR: Unable to parse the stream urls. Source is unknown"
    );
  }

  for (const url of urls) {
    if (subProcessMode) {
      inputs.push(...timestamps.split(" "), "-i", `${url}`);
    } else {
      if (inputSeeking) {
        inputs.push(`${timestamps} -i "${url}"`);
      } else {
        inputs.push(`-i "${url}" ${timestamps}`);
      }
    }
  }

  return inputs;
};

const serializeCropBox = (cropBox: Box) =>
  boxIsSet(cropBox) ? `-lavfi crop=${cropBox.toString()}` : "";

export { preview, generateCommand, serialize };
