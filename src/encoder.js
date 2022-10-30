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

    const previewCommand = `ffmpeg -hide_banner ${inputs.join(
      " "
    )} ${cropLavfi} ${params}`;

    mp.commandv("run", "bash", "-c", `(${previewCommand})`);
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

function serializeInputs(path, timestamps, pureWebmMode, inputSeeking) {
  const isStream = path.search("^http[s]?://") !== -1;

  if (!timestamps && !isStream) {
    return pureWebmMode ? ["-i", `"${path}"`] : [`-i "${path}"`];
  }

  if (!isStream) {
    return pureWebmMode
      ? [...timestamps.split(" "), "-i", `"${path}"`]
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
    if (pureWebmMode) {
      inputs.push(...[...timestamps.split(" "), "-i", `"${url}"`]);
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
