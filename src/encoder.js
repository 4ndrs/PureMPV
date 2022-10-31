// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { getStreamUrls } from "./streams";
import { printMessage } from "./utils";

export class Encoder {
  constructor() {
    this.burnSubs = false;
  }

  preview(startTime, endTime, cropBox) {
    printMessage("Processing preview");

    const path = mp.get_property("path");
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
      (input, index) => `-map ${index}:v? -map ${index}:a?`
    );

    const command = `ffmpeg -hide_banner ${inputs.join(" ")} ${mappings.join(
      " "
    )} ${cropLavfi} ${params}`;

    mp.commandv("run", "bash", "-c", `(${command})`);
  }

  encode(startTime, endTime, cropBox, extraParams) {
    const path = mp.get_property("path");
    const { inputs, cropLavfi } = serialize(
      path,
      startTime,
      endTime,
      cropBox,
      true,
      true
    );

    let command = ["purewebm", ...inputs];

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

export function serialize(
  path,
  startTime,
  endTime,
  cropBox,
  pureWebmMode,
  inputSeeking
) {
  const timestamps = serializeTimestamps(startTime, endTime);
  const inputs = serializeInputs(path, timestamps, pureWebmMode, inputSeeking);
  const cropLavfi = cropBox ? serializeCropBox(cropBox) : null;

  return {
    inputs: inputs,
    cropLavfi: cropLavfi,
  };
}

export function generateCommand(inputs, cropBox, program = "", params = "") {
  program === "purewebm" ? (params = "") : (program = "ffmpeg");
  const cropLavfi = serializeCropBox(cropBox);
  return `${program} ${inputs.join(" ")} ${cropLavfi} ${params}`.trim();
}

function serializeTimestamps(startTime, endTime) {
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
}

function serializeInputs(path, timestamps, subProcessMode, inputSeeking) {
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
    print("ERROR: Unable to parse the stream urls. Source is unknown");
    return;
  }

  for (const url of urls) {
    if (subProcessMode) {
      inputs.push(...[...timestamps.split(" "), "-i", `${url}`]);
    } else {
      inputSeeking
        ? inputs.push(...[`${timestamps} -i "${url}"`])
        : inputs.push(...[`-i "${url}" ${timestamps}`]);
    }
  }

  return inputs;
}

function serializeCropBox(cropBox) {
  if (cropBox.w !== null) {
    return `-lavfi crop=${cropBox.toString()}`;
  }
  return "";
}
