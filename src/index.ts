import {
  printMessage,
  getCopyUtility,
  copyToSelection,
  getTimePosition,
} from "./utils";

import { preview, serialize, generateCommand } from "./ffmpeg";
import { updateSharedData } from "./shared";
import { getCrop } from "./cropbox";

import PureMPV from "./purempv";

const setKeybindings = () => {
  mp.add_key_binding("ctrl+w", "get-file-path", getFilePath);
  mp.add_key_binding("ctrl+shift+w", "generate-preview", preview);
  mp.add_key_binding("ctrl+e", "get-timestamp", getTimestamp);
  mp.add_key_binding("ctrl+c", "get-crop", crop);
  mp.add_key_binding("ctrl+p", "toggle-puremode", togglePureMode);

  mp.add_key_binding("ctrl+shift+e", "set-endtime", () =>
    getTimestamp({ getEndTime: true })
  );
};

const loadConfig = () => {
  mp.options.read_options(PureMPV.options, "PureMPV");

  if (!PureMPV.options.pure_mode) {
    mp.remove_key_binding("generate-preview");
    mp.remove_key_binding("set-endtime");
  }

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
  const path = mp.get_property("path");

  if (typeof path !== "string") {
    throw new Error("Unable to retrieve the path");
  }

  if (!PureMPV.options.pure_mode) {
    copyToSelection(path);
    return;
  }

  const { inputs } = serialize(
    path,
    { isCropping: false },
    false,
    PureMPV.options.input_seeking,
    PureMPV.timestamps.start,
    PureMPV.timestamps.end
  );

  const command = generateCommand(inputs);

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
    status += "ON";

    mp.add_key_binding("ctrl+shift+w", "generate-preview", preview);

    mp.add_key_binding("ctrl+shift+e", "set-endtime", () =>
      getTimestamp({ getEndTime: true })
    );
  } else {
    status += "OFF";

    mp.remove_key_binding("generate-preview");
    mp.remove_key_binding("set-endtime");
  }

  printMessage(status);
};

setKeybindings();
loadConfig();

updateSharedData();
