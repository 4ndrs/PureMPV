// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

export function copyToSelection(text, selection) {
  if (selection != "primary" && selection != "clipboard") {
    print(
      `ERROR: ${selection} is not a valid selection. ` +
        `Possible values are: primary, clipboard`
    );
    print("INFO: setting selection to 'primary'");
    selection = "primary";
  }

  mp.command_native({
    name: "subprocess",
    args: ["xclip", "-selection", selection],
    stdin_data: text,
    detach: true,
  });

  printMessage(`Copied to ${selection}: ${text}`);
}

export function getTimePosition() {
  // Returns the current timestamp in the format HH:MM:SS
  const timePos = mp.get_property("time-pos");
  return new Date(timePos * 1000).toISOString().substring(11, 23);
}

export function printMessage(message) {
  // Prints the message to both the OSD and the console
  mp.osd_message(message);
  print(message);
}
