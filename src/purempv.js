// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { printMessage, copyToSelection, getTimePosition } from "./utils";
import { getStreamUrls } from "./streams";
import PureBox from "./purebox";
import { DEBUG } from "./env";

class PureMPV {
  constructor() {
    this.setKeybindings();
    this.loadConfig();

    this.burnSubs = false;
    this.endTime = null;
    this.startTime = null;

    this.cropBox = new CropBox();

    this.options.pure_box && (this.pureBox = new PureBox());
  }

  setKeybindings() {
    mp.add_key_binding("ctrl+w", "get-file-path", () => this.getFilePath());
    mp.add_key_binding("ctrl+shift+w", "generate-preview", () =>
      this.encode("preview")
    );
    mp.add_key_binding("ctrl+e", "get-timestamp", () => this.getTimestamp());
    mp.add_key_binding("ctrl+shift+e", "set-endtime", () =>
      this.getTimestamp("end-time")
    );
    mp.add_key_binding("ctrl+c", "get-crop", () => this.getCrop());
    mp.add_key_binding("ctrl+p", "toggle-puremode", () =>
      this.togglePureMode()
    );
  }

  loadConfig() {
    this.options = {
      copy_mode: "ffmpeg",
      pure_mode: true,
      pure_box: false,
      pure_webm: false,
      purewebm_params: "",
      ffmpeg_params: "",
      input_seeking: true,
      selection: "primary", // primary or clipboard, see man xclip
      cropbox_animation: false,
    };

    mp.options.read_options(this.options, "PureMPV");

    if (!this.options.pure_mode) {
      mp.remove_key_binding("generate-preview");
      mp.remove_key_binding("set-endtime");
    }

    if (this.options.pure_webm) {
      // Enable encoding with PureWebM
      mp.add_key_binding("ctrl+o", "purewebm", () => this.encode("purewebm"));
      mp.add_key_binding("ctrl+shift+o", "purewebm-params", () =>
        this.encode("purewebm-extra-params")
      );
      mp.add_key_binding("ctrl+v", "toggle-burn-subs", () => {
        this.burnSubs = !this.burnSubs;
        printMessage(`Burn subtitles: ${this.burnSubs ? "yes" : "no"}`);
      });
    }
  }

  // TODO
  encode() {}

  getFilePath() {
    const path = mp.get_property("path");

    if (!this.options.pure_mode) {
      copyToSelection(path, this.options.selection);
      return;
    }

    const timestamps = this.serializeTimestamps();
    const inputs = this.serializeInputs(path, timestamps);
    const cropLavfi = this.serializeCropBox();
    const command = this.generateCommand(inputs, cropLavfi);

    copyToSelection(command, this.options.selection);
  }

  serializeTimestamps() {
    if (this.startTime && this.endTime) {
      return `-ss ${this.startTime} -to ${this.endTime}`;
    }
    if (this.startTime) {
      return `-ss ${this.startTime}`;
    }
    if (this.endTime) {
      return `-to ${this.endTime}`;
    }
    return "";
  }

  serializeInputs(path, timestamps) {
    const isStream = path.search("^http[s]?://") !== -1;

    if (!timestamps && !isStream) {
      return this.options.pure_webm ? ["-i", `"${path}"`] : [`-i "${path}"`];
    }

    if (!isStream) {
      return this.options.pure_webm
        ? [...timestamps.split(" "), "-i", `"${path}"`]
        : this.options.input_seeking
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
      if (this.options.pure_webm) {
        inputs.push(...[...timestamps.split(" "), "-i", `"${url}"`]);
      } else {
        this.options.input_seeking
          ? inputs.push(...[`${timestamps} -i "${url}"`])
          : inputs.push(...[`-i "${url}" ${timestamps}`]);
      }
    }

    return inputs;
  }

  serializeCropBox() {
    if (this.cropBox.w !== null) {
      return `-lavfi crop=${this.cropBox.toString()}`;
    }
    return "";
  }

  generateCommand(inputs, cropLavfi) {
    DEBUG && print(`DEBUG: INPUTS: ${inputs} CROPLAVFI: ${cropLavfi}`);

    const program =
      this.options.copy_mode === "purewebm" ? "purewebm" : "ffmpeg";

    return `${program} ${inputs.join(" ")} ${cropLavfi}`;
  }

  getTimestamp(getEndTime) {
    const timestamp = getTimePosition();

    if (DEBUG) {
      print(`DEBUG: TIMESTAMP: ${timestamp}`);
      print(`DEBUG: STARTTIME: ${this.startTime} ENDTIME: ${this.endTime}`);
    }

    if (getEndTime && this.options.pure_mode) {
      this.endTime = timestamp;
      printMessage(`Set end time: ${this.endTime}`);
      return;
    }

    if (!this.options.pure_mode) {
      // Copy to selection if PureMode is off
      copyToSelection(timestamp, this.options.selection);
    } else if (!this.startTime) {
      this.startTime = timestamp;
      printMessage(`Set start time: ${this.startTime}`);
    } else if (!this.endTime) {
      this.endTime = timestamp;
      printMessage(`Set end time: ${this.endTime}`);
    } else {
      [this.startTime, this.endTime] = [null, null];
      printMessage("Times reset");
    }
  }

  getCrop() {
    if (this.options.pure_box) {
      [this.cropBox.x, this.cropBox.y, this.cropBox.w, this.cropBox.h] =
        this.pureBox.getCrop();

      // Copy to selection if PureMode is off
      !this.options.pure_mode &&
        copyToSelection(this.cropBox.toString(), this.options.selection);
    } else {
      // TODO
      return;
    }
  }

  togglePureMode() {
    this.options.pure_mode = !this.options.pure_mode;
    let status = "Pure Mode: ";
    if (this.options.pure_mode) {
      status += "ON";
      mp.add_key_binding("ctrl+shift+w", "generate-preview", () =>
        this.encode("preview")
      );
      mp.add_key_binding("ctrl+shift+e", "set-endtime", () =>
        this.getTimestamp("end-time")
      );
    } else {
      status += "OFF";
      mp.remove_key_binding("generate-preview");
      mp.remove_key_binding("set-endtime");
    }
    printMessage(status);
  }

  resetCrop() {
    [
      this.cropBox.constX,
      this.cropBox.constY,
      this.cropBox.w,
      this.cropBox.h,
      this.cropBox.x,
      this.cropBox.y,
    ] = Array(6).fill(null);

    if (!this.options.pure_box) {
      // Remove the box drawn with ffmpeg filters
      mp.commandv("vf", "remove", "@box");
    }

    printMessage("Crop reset");
  }
}

class CropBox {
  constructor() {
    this.isCropping = false;
    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;
  }
  toString() {
    // Return the cropBox as a string for ffmpeg's crop filter
    return `${this.w}:${this.h}:${this.x}:${this.y}`;
  }
}

export const pure = new PureMPV();
