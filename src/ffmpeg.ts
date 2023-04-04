import { getPath, printMessage } from "./utils";
import { getStreamUrls } from "./streams";
import { boxIsSet } from "./cropbox";

import PureMPV from "./purempv";

const preview = () => {
  printMessage("Processing preview");

  const muteAudio = mp.get_property("mute") === "yes" ? "-an" : "";
  const inputs = serializeInputs();
  const cropLavfi = serializeCropBox();

  const params =
    `${muteAudio} -map_metadata -1 -map_chapters -1 -f matroska ` +
    "-c:v libx264 -preset ultrafast - | mpv - --loop";

  const mappings = inputs.map(
    (_input, index) => `-map ${index}:v? -map ${index}:a?`
  );

  const command = `ffmpeg -hide_banner ${inputs.join(" ")} ${mappings.join(
    " "
  )} ${cropLavfi} ${params}`;

  mp.commandv("run", "bash", "-c", `(${command})`);
};

const generateCommand = () => {
  const program = PureMPV.options.executable;
  const params = PureMPV.options.ffmpeg_params;
  const inputs = serializeInputs();
  const cropLavfi = serializeCropBox();

  return `${program} ${inputs.join(" ")} ${cropLavfi} ${params}`.trim();
};

const serializeTimestamps = ({ start, end }: typeof PureMPV.timestamps) =>
  `${start ? "-ss " + start : ""}${
    end ? (start ? " " : "") + "-to " + end : ""
  }`;

const serializeInputs = (options = { subProcessMode: false }) => {
  // Note: in subprocess mode this function returns an array of inputs adapted
  // for running as subprocess's args, if it is off, each item will be pushed as
  // a single string with quoted input paths. The following is an example of a single item
  // with inputSeeking=true and subProcessMode=false:
  // '-ss start time -to stop time -i "input/file/path"'
  const inputSeeking = PureMPV.options.input_seeking;
  const timestamps = serializeTimestamps(PureMPV.timestamps);
  const path = getPath();

  const isStream = path.search("^http[s]?://") !== -1;

  if (!timestamps && !isStream) {
    return options.subProcessMode ? ["-i", `${path}`] : [`-i "${path}"`];
  }

  if (!isStream) {
    return options.subProcessMode
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
    if (options.subProcessMode) {
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

const serializeCropBox = () =>
  boxIsSet(PureMPV.cropBox) ? `-lavfi crop=${PureMPV.cropBox.toString()}` : "";

export { preview, generateCommand };
