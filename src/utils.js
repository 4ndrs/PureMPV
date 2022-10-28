// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import { DEBUG } from "./env";

/* global mp */

export function copyToSelection(text, selection) {
  mp.commandv(
    "run",
    "bash",
    "-c",
    `(echo -n '${text}'| xclip -selection ${selection})`
  );

  printMessage(`Copied to ${selection}: ${text}`);
}

export function getFilePath() {
  return mp.get_property("path");
}

export function getTimePosition() {
  // Returns the current timestamp in the format HH:MM:SS
  const timePos = mp.get_property("time-pos");
  DEBUG && print(`DEBUG: TIME-POS: ${timePos}`);
  return new Date(timePos * 1000).toISOString().substring(11, 23);
}

export function printMessage(message) {
  // Prints the message to both the OSD and the console
  mp.osd_message(message);
  print(message);
}
