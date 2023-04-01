import {
  printMessage,
  getCopyUtility,
  copyToSelection,
  getTimePosition,
} from "./utils";

import { encode, preview, serialize, generateCommand } from "./encoder";
import { getCrop } from "./cropbox";

import purempv from "./store";

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
  mp.options.read_options(purempv.options, "PureMPV");

  if (!purempv.options.pure_mode) {
    mp.remove_key_binding("generate-preview");
    mp.remove_key_binding("set-endtime");
  }

  if (purempv.options.pure_webm) {
    mp.add_key_binding("ctrl+o", "purewebm", encode);

    mp.add_key_binding("ctrl+shift+o", "purewebm-extra-params", () =>
      encode(purempv.options.purewebm_extra_params)
    );

    mp.add_key_binding("ctrl+v", "toggle-burn-subs", () => {
      const { purewebm } = purempv;

      purewebm.burnSubs = !purewebm.burnSubs;
      printMessage(`Burn subtitles: ${purewebm.burnSubs ? "yes" : "no"}`);
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
};

const crop = () => {
  getCrop();

  if (!purempv.options.pure_mode && !purempv.cropBox.isCropping) {
    copyToSelection(purempv.cropBox.toString());
  }
};

const getFilePath = () => {
  const path = mp.get_property("path");

  if (typeof path !== "string") {
    throw new Error("Unable to retrieve the path");
  }

  if (!purempv.options.pure_mode) {
    copyToSelection(path);
    return;
  }

  const { inputs } = serialize(
    path,
    { isCropping: false },
    false,
    purempv.options.input_seeking,
    purempv.timestamps.start,
    purempv.timestamps.end
  );

  const command = generateCommand(inputs);

  copyToSelection(command);
};

const getTimestamp = (options?: { getEndTime: boolean }) => {
  const timestamp = getTimePosition();

  if (options?.getEndTime && purempv.options.pure_mode) {
    purempv.timestamps.end = timestamp;

    printMessage(`Set end time: ${purempv.timestamps.end}`);
    return;
  }

  if (!purempv.options.pure_mode) {
    copyToSelection(timestamp);
  } else if (!purempv.timestamps.start) {
    purempv.timestamps.start = timestamp;
    printMessage(`Set start time: ${purempv.timestamps.start}`);
  } else if (!purempv.timestamps.end) {
    purempv.timestamps.end = timestamp;
    printMessage(`Set end time: ${purempv.timestamps.end}`);
  } else {
    delete purempv.timestamps.start;
    delete purempv.timestamps.end;
    printMessage("Times reset");
  }
};

const togglePureMode = () => {
  purempv.options.pure_mode = !purempv.options.pure_mode;

  let status = "Pure Mode: ";

  if (purempv.options.pure_mode) {
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
