// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import {
  printMessage,
  getCopyUtility,
  copyToSelection,
  getTimePosition,
} from "./utils";

import { Encoder, serialize, generateCommand } from "./encoder";
import CropBox from "./cropbox";
import { Options } from "./types";

class PureMPV {
  options: Options;
  encoder: Encoder;
  cropBox: CropBox;
  endTime: string | null;
  startTime: string | null;

  constructor() {
    this.setKeybindings();

    this.options = this.loadConfig();

    this.endTime = null;
    this.startTime = null;

    this.encoder = new Encoder();
    this.cropBox = new CropBox(
      this.options.pure_box,
      this.options.hide_osc_on_crop
    );
  }

  setKeybindings() {
    mp.add_key_binding("ctrl+w", "get-file-path", () => this.getFilePath());
    mp.add_key_binding("ctrl+shift+w", "generate-preview", () =>
      this.encode("preview")
    );
    mp.add_key_binding("ctrl+e", "get-timestamp", () => this.getTimestamp());
    mp.add_key_binding("ctrl+shift+e", "set-endtime", () =>
      this.getTimestamp({ getEndTime: true })
    );
    mp.add_key_binding("ctrl+c", "get-crop", () => this.crop());
    mp.add_key_binding("ctrl+p", "toggle-puremode", () =>
      this.togglePureMode()
    );
  }

  loadConfig() {
    const options: Options = {
      copy_mode: "ffmpeg",
      pure_mode: true,
      pure_box: false,
      pure_webm: false,
      ffmpeg_params: "",
      purewebm_extra_params: "",
      input_seeking: true,
      selection: "primary", // primary or clipboard, see man xclip
      copy_utility: "detect", // detect xclip or wl-copy
      hide_osc_on_crop: false,
    };

    mp.options.read_options(options, "PureMPV");

    if (!options.pure_mode) {
      mp.remove_key_binding("generate-preview");
      mp.remove_key_binding("set-endtime");
    }

    if (options.pure_webm) {
      // Enable encoding with PureWebM
      mp.add_key_binding("ctrl+o", "purewebm", () => this.encode("purewebm"));
      mp.add_key_binding("ctrl+shift+o", "purewebm-extra-params", () =>
        this.encode("purewebm-extra-params")
      );
      mp.add_key_binding("ctrl+v", "toggle-burn-subs", () => {
        this.encoder.burnSubs = !this.encoder.burnSubs;
        printMessage(`Burn subtitles: ${this.encoder.burnSubs ? "yes" : "no"}`);
      });
    }

    if (options.copy_utility === "detect") {
      try {
        options.copy_utility = getCopyUtility();
      } catch (error) {
        if (error instanceof Error) {
          mp.msg.error(error.message);
          options.copy_utility = "xclip";
        }
      }
    }

    return options;
  }

  crop() {
    this.cropBox.getCrop(this.options.pure_mode);
    if (!this.options.pure_mode && !this.cropBox.isCropping) {
      copyToSelection(
        this.cropBox.toString(),
        this.options.selection,
        this.options.copy_utility
      );
    }
  }

  encode(mode: "preview" | "purewebm" | "purewebm-extra-params") {
    const args = [this.startTime, this.endTime, this.cropBox] as const;
    switch (mode) {
      case "preview":
        this.encoder.preview(...args);
        return;
      case "purewebm":
        this.encoder.encode(...args);
        return;
      case "purewebm-extra-params":
        this.encoder.encode(...args, this.options.purewebm_extra_params);
        return;
    }
  }

  getFilePath() {
    const path = mp.get_property("path") as string;

    if (!this.options.pure_mode) {
      copyToSelection(path, this.options.selection, this.options.copy_utility);
      return;
    }

    const { inputs } = serialize(
      path,
      this.startTime,
      this.endTime,
      null,
      false,
      this.options.input_seeking
    );

    const command = generateCommand(
      inputs,
      this.cropBox,
      this.options.copy_mode,
      this.options.ffmpeg_params
    );

    copyToSelection(command, this.options.selection, this.options.copy_utility);
  }

  getTimestamp(options?: { getEndTime: boolean }) {
    const timestamp = getTimePosition();

    if (options?.getEndTime && this.options.pure_mode) {
      this.endTime = timestamp;
      printMessage(`Set end time: ${this.endTime}`);
      return;
    }

    if (!this.options.pure_mode) {
      // Copy to selection if PureMode is off
      copyToSelection(
        timestamp,
        this.options.selection,
        this.options.copy_utility
      );
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

  togglePureMode() {
    this.options.pure_mode = !this.options.pure_mode;
    let status = "Pure Mode: ";
    if (this.options.pure_mode) {
      status += "ON";
      mp.add_key_binding("ctrl+shift+w", "generate-preview", () =>
        this.encode("preview")
      );
      mp.add_key_binding("ctrl+shift+e", "set-endtime", () =>
        this.getTimestamp({ getEndTime: true })
      );
    } else {
      status += "OFF";
      mp.remove_key_binding("generate-preview");
      mp.remove_key_binding("set-endtime");
    }
    printMessage(status);
  }
}

new PureMPV();
