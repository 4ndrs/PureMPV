// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

export function copyToSelection(text, selection) {
  mp.commandv(
    "run",
    "bash",
    "-c",
    `(echo -n '${text}'| xclip -selection ${selection})`
  );

  printMessage(`Copied: ${text}`);
}

export function getFilePath() {
  return mp.get_property("path");
}

export function printMessage(message) {
  // Prints the message to both the OSD and the console
  mp.osd_message(message);
  print(message);
}
