import CropBox from "./cropbox";
import { getStreamUrls } from "./streams";
import { printMessage } from "./utils";

import purempv from "./store";

class Encoder {
  burnSubs: boolean;

  constructor() {
    this.burnSubs = false;
  }

  preview(startTime: string | null, endTime: string | null, cropBox: CropBox) {
    printMessage("Processing preview");

    const path = mp.get_property("path") as string;
    const muteAudio = mp.get_property("mute") === "yes" ? "-an" : "";
    const params =
      `${muteAudio} -map_metadata -1 -map_chapters -1 -f matroska ` +
      "-c:v libx264 -preset ultrafast - | mpv - --loop";

    const { inputs, cropLavfi } = serialize(
      path,
      startTime,
      endTime,
      cropBox,
      false,
      true
    );

    const mappings = inputs.map(
      (_input, index) => `-map ${index}:v? -map ${index}:a?`
    );

    const command = `ffmpeg -hide_banner ${inputs.join(" ")} ${mappings.join(
      " "
    )} ${cropLavfi} ${params}`;

    mp.commandv("run", "bash", "-c", `(${command})`);
  }

  encode(
    startTime: string | null,
    endTime: string | null,
    cropBox: CropBox,
    extraParams?: string
  ) {
    const path = mp.get_property("path") as string;
    const { inputs, cropLavfi } = serialize(
      path,
      startTime,
      endTime,
      cropBox,
      true,
      true
    );

    const command = ["purewebm", ...inputs];

    if (cropLavfi) {
      command.push(...cropLavfi.split(" "));
    }

    if (this.burnSubs) {
      command.push("-subs");
    }

    if (extraParams) {
      command.push(...["--extra_params", extraParams]);
    }

    mp.command_native({
      name: "subprocess",
      args: command,
      detach: true,
    });
  }
}

const serialize = (
  path: string,
  startTime: string | null,
  endTime: string | null,
  cropBox: CropBox | null,
  pureWebmMode: boolean,
  inputSeeking: boolean
) => {
  const timestamps = serializeTimestamps(startTime, endTime);
  const inputs = serializeInputs(path, timestamps, pureWebmMode, inputSeeking);
  const cropLavfi = cropBox ? serializeCropBox(cropBox) : null;

  return {
    inputs: inputs,
    cropLavfi: cropLavfi,
  };
};

const generateCommand = (inputs: string[], cropBox: CropBox) => {
  let program = purempv.options.copy_mode;
  let params = purempv.options.ffmpeg_params;

  if (program === "purewebm") {
    params = "";
  } else {
    program = "ffmpeg";
  }

  const cropLavfi = serializeCropBox(cropBox);

  return `${program} ${inputs.join(" ")} ${cropLavfi} ${params}`.trim();
};

const serializeTimestamps = (
  startTime: string | null,
  endTime: string | null
) => {
  if (startTime && endTime) {
    return `-ss ${startTime} -to ${endTime}`;
  }
  if (startTime) {
    return `-ss ${startTime}`;
  }
  if (endTime) {
    return `-to ${endTime}`;
  }
  return "";
};

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

const serializeCropBox = (cropBox: CropBox) => {
  const cropBoxString = cropBox.toString();
  if (cropBoxString !== "") {
    return `-lavfi crop=${cropBox.toString()}`;
  }
  return "";
};

export { Encoder, generateCommand, serialize };
