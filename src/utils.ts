import PureMPV from "./purempv";

const copyToSelection = (text: string) => {
  let { copy_utility: copyUtility, selection } = PureMPV.options;

  if (copyUtility !== "xclip" && copyUtility !== "wl-copy") {
    mp.msg.error(
      `ERROR: ${copyUtility} is not a known copy utility. ` +
        "Possible values are: xclip, wl-copy"
    );

    print("INFO: setting copy utility to 'xclip'");

    copyUtility = "xclip";
  }

  if (selection != "primary" && selection != "clipboard") {
    mp.msg.error(
      `ERROR: ${selection} is not a valid selection. ` +
        `Possible values are: primary, clipboard`
    );

    print("INFO: setting selection to 'primary'");

    selection = "primary";
  }

  let args;

  if (copyUtility === "xclip") {
    args = ["xclip", "-selection", selection];
  } else {
    args = ["wl-copy"];

    if (selection === "primary") {
      args = [...args, "--primary"];
    }
  }

  const { status } = mp.command_native({
    name: "subprocess",
    args,
    stdin_data: text,
    detach: true,
  }) as { status: number };

  if (status === -3) {
    mp.msg.error(`Received status: ${status}`);

    printMessage(
      `Error occurred during the execution of ${copyUtility}. ` +
        `Please verify your ${copyUtility} installation.`
    );

    return;
  }

  printMessage(`Copied to ${selection}: ${text}`);
};

const getCopyUtility = () => {
  const { status: xclipStatus } = mp.command_native({
    name: "subprocess",
    args: ["xclip", "-version"],
    detach: true,
    capture_stderr: true,
  }) as { status: number };

  if (xclipStatus !== -3) {
    return "xclip";
  }

  const { status: wlCopyStatus } = mp.command_native({
    name: "subprocess",
    args: ["wl-copy", "--version"],
    detach: true,
    capture_stdout: true,
  }) as { status: number };

  if (wlCopyStatus !== -3) {
    return "wl-copy";
  }

  throw new Error(
    "No xclip/wl-clipboard found installed. Copying will not work."
  );
};

/**
 * Returns the current timestamp in the format HH:MM:SS
 */
const getTimePosition = () => {
  const timePos = mp.get_property_native("time-pos");

  if (typeof timePos !== "number") {
    throw new Error("Unable to retrieve the time position");
  }

  return new Date(timePos * 1000).toISOString().substring(11, 23);
};

const getPath = () => {
  const path = mp.get_property("path");

  if (typeof path !== "string") {
    throw new Error("Unable to get the path");
  }

  return path;
};

/**
 * Prints the message to both the OSD and the console
 */
const printMessage = (message: string) => {
  mp.osd_message(message);
  print(message);
};

export {
  copyToSelection,
  getCopyUtility,
  getTimePosition,
  printMessage,
  getPath,
};
