import {
  printMessage,
  getCopyUtility,
  copyToSelection,
  getTimePosition,
} from "./utils";

import { Encoder, serialize, generateCommand } from "./encoder";
import CropBox from "./cropbox";

import purempv from "./store";

class PureMPV {
  encoder: Encoder;
  cropBox: CropBox;
  endTime: string | null;
  startTime: string | null;

  constructor() {
    this.setKeybindings();

    this.loadConfig();

    this.endTime = null;
    this.startTime = null;

    this.encoder = new Encoder();
    this.cropBox = new CropBox();
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
    mp.options.read_options(purempv.options, "PureMPV");

    if (!purempv.options.pure_mode) {
      mp.remove_key_binding("generate-preview");
      mp.remove_key_binding("set-endtime");
    }

    if (purempv.options.pure_webm) {
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

    if (purempv.options.copy_utility === "detect") {
      try {
        purempv.options.copy_utility = getCopyUtility();
      } catch (error) {
        if (error instanceof Error) {
          mp.msg.error(error.message);
          purempv.options.copy_utility = "xclip";
        }
      }
    }
  }

  crop() {
    this.cropBox.getCrop();
    if (!purempv.options.pure_mode && !this.cropBox.isCropping) {
      copyToSelection(this.cropBox.toString());
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
        this.encoder.encode(...args, purempv.options.purewebm_extra_params);
        return;
    }
  }

  getFilePath() {
    const path = mp.get_property("path") as string;

    if (!purempv.options.pure_mode) {
      copyToSelection(path);
      return;
    }

    const { inputs } = serialize(
      path,
      this.startTime,
      this.endTime,
      null,
      false,
      purempv.options.input_seeking
    );

    const command = generateCommand(inputs, this.cropBox);

    copyToSelection(command);
  }

  getTimestamp(options?: { getEndTime: boolean }) {
    const timestamp = getTimePosition();

    if (options?.getEndTime && purempv.options.pure_mode) {
      this.endTime = timestamp;
      printMessage(`Set end time: ${this.endTime}`);
      return;
    }

    if (!purempv.options.pure_mode) {
      // Copy to selection if PureMode is off
      copyToSelection(timestamp);
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
    purempv.options.pure_mode = !purempv.options.pure_mode;
    let status = "Pure Mode: ";
    if (purempv.options.pure_mode) {
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
