import {
  printMessage,
  getCopyUtility,
  copyToSelection,
  getTimePosition,
  getPath,
} from "./utils";

import { preview, generateCommand } from "./ffmpeg";
import { updateSharedData } from "./shared";
import { getCrop } from "./cropbox";

import PureMPV from "./purempv";

const loadConfig = () => {
  mp.options.read_options(PureMPV.options, "PureMPV");

  if (PureMPV.options.copy_utility === "detect") {
    try {
      PureMPV.options.copy_utility = getCopyUtility();
    } catch (error) {
      if (error instanceof Error) {
        mp.msg.error(error.message);
        PureMPV.options.copy_utility = "xclip";
      }
    }
  }

  if (PureMPV.options.copy_utility === "pbcopy") {
    // pbcopy does not have a selection option, the clipboard is the default
    PureMPV.options.selection = "clipboard";
  }
};

const setKeybindings = () => {
  const keys = PureMPV.getKeys();

  mp.add_key_binding(keys.path, "get-file-path", getFilePath);
  mp.add_key_binding(keys.time, "get-timestamp", getTimestamp);
  mp.add_key_binding(keys.crop, "get-crop", crop);
  mp.add_key_binding(keys.mode, "toggle-puremode", togglePureMode);

  if (PureMPV.options.pure_mode) {
    mp.add_key_binding(keys.preview, "generate-preview", preview);
    mp.add_key_binding(keys.timeEnd, "set-endtime", () =>
      getTimestamp({ getEndTime: true })
    );
  }
};

const crop = () => {
  getCrop();

  if (!PureMPV.options.pure_mode && !PureMPV.cropBox.isCropping) {
    copyToSelection(PureMPV.cropBox.toString());
  }

  if (!PureMPV.cropBox.isCropping) {
    updateSharedData();
  }
};

const getFilePath = () => {
  if (!PureMPV.options.pure_mode) {
    const path = getPath();

    copyToSelection(path);
    return;
  }

  const command = generateCommand();
  copyToSelection(command);
};

const getTimestamp = (options?: { getEndTime: boolean }) => {
  const timestamp = getTimePosition();

  if (options?.getEndTime && PureMPV.options.pure_mode) {
    PureMPV.timestamps.end = timestamp;

    printMessage(`Set end time: ${PureMPV.timestamps.end}`);

    updateSharedData();
    return;
  }

  if (!PureMPV.options.pure_mode) {
    copyToSelection(timestamp);
  } else if (!PureMPV.timestamps.start) {
    PureMPV.timestamps.start = timestamp;

    printMessage(`Set start time: ${PureMPV.timestamps.start}`);

    updateSharedData();
  } else if (!PureMPV.timestamps.end) {
    PureMPV.timestamps.end = timestamp;

    printMessage(`Set end time: ${PureMPV.timestamps.end}`);

    updateSharedData();
  } else {
    delete PureMPV.timestamps.start;
    delete PureMPV.timestamps.end;

    printMessage("Times reset");

    updateSharedData();
  }
};

const togglePureMode = () => {
  PureMPV.options.pure_mode = !PureMPV.options.pure_mode;

  let status = "Pure Mode: ";

  if (PureMPV.options.pure_mode) {
    const keys = PureMPV.getKeys();

    status += "ON";

    mp.add_key_binding(keys.preview, "generate-preview", preview);
    mp.add_key_binding(keys.timeEnd, "set-endtime", () =>
      getTimestamp({ getEndTime: true })
    );
  } else {
    status += "OFF";

    mp.remove_key_binding("generate-preview");
    mp.remove_key_binding("set-endtime");
  }

  printMessage(status);
};

loadConfig();
setKeybindings();

PureMPV.setBoxColor();

updateSharedData();
