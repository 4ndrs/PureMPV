import { printMessage } from "./utils";
import purempv from "./store";

import type { Box } from "./types";

type Mouse = { x: number; y: number };
type Video = { height: number; width: number };

const { cropBox } = purempv;
const overlay = mp.create_osd_overlay("ass-events");

class CropBox {
  getCrop() {
    if (purempv.options.pure_mode && !cropBox.isCropping && boxIsSet(cropBox)) {
      this.resetCrop();
      return;
    }

    this.generateCrop();
  }

  generateCrop() {
    if (!cropBox.isCropping) {
      cropBox.isCropping = true;
      this.setInitialMousePosition();

      mp.observe_property("mouse-pos", "native", animateBox);

      if (purempv.options.hide_osc_on_crop) {
        mp.command("script-message osc-visibility never");
      }

      print("Cropping started");
    } else {
      overlay.remove();
      this.normalizeCrop();

      cropBox.isCropping = false;

      mp.unobserve_property(animateBox);

      if (purempv.options.hide_osc_on_crop) {
        mp.command("script-message osc-visibility auto");
      }

      print("Cropping ended");
    }
  }

  setInitialMousePosition() {
    const mouse = getProperties("mouse");

    cropBox.x = mouse.x;
    cropBox.y = mouse.y;
    cropBox.constX = mouse.x;
    cropBox.constY = mouse.y;
  }

  normalizeCrop() {
    const osd = getProperties("osd");
    const video = getProperties("video");

    if (!boxIsSet(cropBox)) {
      throw new Error("cropBox is not set");
    }

    const { width: windowWidth, height: windowHeight } = osd;

    let [yBoundary, xBoundary] = [0, 0];
    let ratioWidth = (windowHeight * video.width) / video.height;
    let ratioHeight = (windowWidth * video.height) / video.width;

    if (ratioWidth > windowWidth) {
      ratioWidth = windowWidth;
      yBoundary = windowHeight - ratioHeight;
    } else if (ratioHeight > windowHeight) {
      ratioHeight = windowHeight;
      xBoundary = windowWidth - ratioWidth;
    }

    cropBox.y -= Math.ceil(yBoundary / 2);
    cropBox.x -= Math.ceil(xBoundary / 2);

    const proportion = Math.min(
      video.width / ratioWidth,
      video.height / ratioHeight
    );

    cropBox.w = Math.ceil(cropBox.w * proportion);
    cropBox.h = Math.ceil(cropBox.h * proportion);
    cropBox.x = Math.ceil(cropBox.x * proportion);
    cropBox.y = Math.ceil(cropBox.y * proportion);
  }

  /**
   * Returns the cropBox as a string for ffmpeg's crop filter
   */
  toString() {
    if (boxIsSet(cropBox)) {
      return `${cropBox.w}:${cropBox.h}:${cropBox.x}:${cropBox.y}`;
    }
    return "";
  }

  resetCrop() {
    delete cropBox.h;
    delete cropBox.w;
    delete cropBox.y;
    delete cropBox.x;
    delete cropBox.constY;
    delete cropBox.constX;

    printMessage("Crop reset");
  }
}

const animateBox = (_name: unknown, mouse: unknown) => {
  if (
    !mouse ||
    typeof mouse !== "object" ||
    !("x" in mouse) ||
    !("y" in mouse) ||
    typeof mouse.x !== "number" ||
    typeof mouse.y !== "number"
  ) {
    throw new Error(
      `Did not receive mouse coordinates: ${JSON.stringify(mouse)}`
    );
  }

  calculateBox({ x: mouse.x, y: mouse.y });
  drawBox();
};

const drawBox = () => {
  if (!boxIsSet(cropBox)) {
    throw new Error("cropbox is not set");
  }

  const deepPink = "9314FF"; // 0xFF1493
  const borderColor = `{\\3c&${deepPink}&}`;
  const fillColor = "{\\1a&FF&}";
  const borderWidth = "{\\bord4}";
  const positionOffset = "{\\pos(0, 0)}";

  const osd = getProperties("osd");

  overlay.res_y = osd.height;
  overlay.res_x = osd.width;

  const { x, y, w, h } = cropBox;

  const _box =
    `{\\p1}m ${x} ${y} l ${x + w} ${y} ${x + w} ` +
    `${y + h} ${x} ${y + h} {\\p0}`;

  const data = `${positionOffset}${borderColor}${fillColor}${borderWidth}${_box}`;

  overlay.data = data;
  overlay.update();
};

const calculateBox = (mouse: Mouse) => {
  if (
    typeof cropBox.constX !== "number" ||
    typeof cropBox.constY !== "number" ||
    typeof cropBox.x !== "number" ||
    typeof cropBox.y !== "number"
  ) {
    throw new Error(
      `the cropbox was not initialized: ${JSON.stringify(cropBox)}`
    );
  }

  if (mouse.x < cropBox.constX) {
    cropBox.x = mouse.x;
    mouse.x = cropBox.constX;
    cropBox.x = Math.min(mouse.x, cropBox.x);
    cropBox.w = mouse.x - cropBox.x;
  } else {
    mouse.x = Math.max(mouse.x, cropBox.x);
    cropBox.x = Math.min(mouse.x, cropBox.x);
    cropBox.w = mouse.x - cropBox.x;
  }

  if (mouse.y < cropBox.constY) {
    cropBox.y = mouse.y;
    mouse.y = cropBox.constY;
    cropBox.y = Math.min(mouse.y, cropBox.y);
    cropBox.h = mouse.y - cropBox.y;
  } else {
    mouse.y = Math.max(mouse.y, cropBox.y);
    cropBox.y = Math.min(mouse.y, cropBox.y);
    cropBox.h = mouse.y - cropBox.y;
  }
};

// Overloading
type GetProperties = {
  (kind: "mouse"): Mouse;
  (kind: "video"): Video;
  (kind: "osd"): Video;
};

const getProperties: GetProperties = (kind: "mouse" | "video" | "osd") => {
  if (kind === "mouse") {
    const mouse = mp.get_property_native("mouse-pos");

    if (
      !mouse ||
      typeof mouse !== "object" ||
      !("x" in mouse) ||
      !("y" in mouse) ||
      typeof mouse.x !== "number" ||
      typeof mouse.y !== "number"
    ) {
      throw new Error("Unable to retrieve mouse properties");
    }

    return { x: mouse.x, y: mouse.y } as Mouse & Video;
  }

  if (kind === "osd") {
    const osd = mp.get_osd_size();

    if (
      !osd ||
      !("height" in osd) ||
      !("width" in osd) ||
      typeof osd.width !== "number" ||
      typeof osd.height !== "number"
    ) {
      throw new Error("Unable to retrieve OSD size");
    }

    return { height: osd.height, width: osd.width } as Mouse & Video;
  }

  const width = mp.get_property_native("width");
  const height = mp.get_property_native("height");

  if (typeof height !== "number" || typeof width !== "number") {
    throw new Error("Unable to retrieve video properties");
  }

  return { width, height } as Mouse & Video;
};

const boxIsSet = (box: Box): box is Required<Box> =>
  typeof box.w === "number" &&
  typeof box.h === "number" &&
  typeof box.x === "number" &&
  typeof box.constX === "number" &&
  typeof box.constY === "number";

export default CropBox;
