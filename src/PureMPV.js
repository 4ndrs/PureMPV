// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { printMessage, copyToSelection } from "./utils";
import PureBox from "./purebox";

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
    mp.add_key_binding("ctrl+shift+e", "set-endtime", () => this.setEndtime());
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

    if (this.options.pure_box) {
      // Enable cropping with PureBox
      mp.remove_key_binding("get-crop");
      mp.add_key_binding("ctrl+c", "get-crop", () => this.getCrop("purebox"));
    }

    if (this.options.pure_webm) {
      // Enable encoding with PureWebM
      mp.add_key_binding("ctrl+o", "purewebm", () => this.encode("purewebm"));
      mp.add_key_binding("ctrl+shift+o", "purewebm-params", () =>
        this.encode("purewebm-extra-params")
      );
      mp.add_key_binding("ctrl+v", "toggle-burn-subs", () => {
        this.burnSubs = !this.burnSubs;
        mp.osd_message(`Burn subtitles: ${this.burnSubs ? "yes" : "no"}`);
      });
    }
  }

  // TODO
  encode() {}
  setEndTime() {}
  getFilePath() {}
  getTimestamp() {}

  getCrop(mode) {
    switch (mode) {
      case "purebox":
        [this.cropBox.x, this.cropBox.y, this.cropBox.w, this.cropBox.h] =
          this.pureBox.getCrop();

        // Copy to selection if PureMode is off
        !this.options.pure_mode &&
          copyToSelection(this.cropBox.toString(), this.options.selection);
        break;
      default:
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
      mp.add_key_binding("ctrl+shift+e", "set-endtime", this.setEndTime);
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
