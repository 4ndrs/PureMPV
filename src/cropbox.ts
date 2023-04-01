import { MouseProperties, VideoProperties } from "./properties";

import { printMessage } from "./utils";

import purempv from "./store";

import type { Box, MousePos, OSDSize, SetBox } from "./types";

const { cropBox } = purempv;

class CropBox {
  mouse!: MouseProperties;
  video!: VideoProperties;

  constructor() {
    this.mouse = new MouseProperties();
    this.video = new VideoProperties();
  }

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
    this.mouse.getProperties();
    if (this.mouse.x === null || this.mouse.y === null) {
      throw new Error("Unable to retrieve mouse coordinates");
    }

    cropBox.x = this.mouse.x;
    cropBox.y = this.mouse.y;
    cropBox.constX = this.mouse.x;
    cropBox.constY = this.mouse.y;
  }

  normalizeCrop() {
    const osdSize = mp.get_osd_size();
    this.video.getProperties();

    if (
      typeof this.video.height !== "number" ||
      typeof this.video.width !== "number"
    ) {
      throw new Error("Unable to get the video's properties");
    }

    if (!isOSDSize(osdSize)) {
      throw new Error("Unable to get the OSD sizes");
    }

    if (!boxIsSet(cropBox)) {
      throw new Error("cropBox is not set");
    }

    const { width: windowWidth, height: windowHeight } = osdSize;

    let [yBoundary, xBoundary] = [0, 0];
    let ratioWidth = (windowHeight * this.video.width) / this.video.height;
    let ratioHeight = (windowWidth * this.video.height) / this.video.width;

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
      this.video.width / ratioWidth,
      this.video.height / ratioHeight
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

const overlay = mp.create_osd_overlay("ass-events");

const animateBox = (_name: unknown, mousePos: unknown) => {
  if (!isMousePos(mousePos)) {
    throw new Error(`Not a MousePos: ${JSON.stringify(mousePos)}`);
  }

  calculateBox(mousePos);
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

  const osdSize = mp.get_osd_size();

  if (isOSDSize(osdSize)) {
    ({ width: overlay.res_x, height: overlay.res_y } = osdSize);
  } else {
    mp.msg.error(
      "ERROR: Couldn't get the OSD size.The drawn cropbox might be incorrect."
    );
  }

  const { x, y, w: width, h: height } = cropBox;

  const _box =
    `{\\p1}m ${x} ${y} l ${x + width} ${y} ${x + width} ` +
    `${y + height} ${x} ${y + height} {\\p0}`;

  const data = `${positionOffset}${borderColor}${fillColor}${borderWidth}${_box}`;

  overlay.data = data;
  overlay.update();
};

const calculateBox = (mousePos: MousePos) => {
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

  let { x, y } = mousePos;

  if (x < cropBox.constX) {
    cropBox.x = x;
    x = cropBox.constX;
    cropBox.x = Math.min(x, cropBox.x);
    cropBox.w = x - cropBox.x;
  } else {
    x = Math.max(x, cropBox.x);
    cropBox.x = Math.min(x, cropBox.x);
    cropBox.w = x - cropBox.x;
  }

  if (y < cropBox.constY) {
    cropBox.y = y;
    y = cropBox.constY;
    cropBox.y = Math.min(y, cropBox.y);
    cropBox.h = y - cropBox.y;
  } else {
    y = Math.max(y, cropBox.y);
    cropBox.y = Math.min(y, cropBox.y);
    cropBox.h = y - cropBox.y;
  }
};

const isMousePos = (value: unknown): value is MousePos =>
  typeof (value as MousePos)?.x === "number" &&
  typeof (value as MousePos)?.y === "number";

const isOSDSize = (value: mp.OSDSize | undefined): value is OSDSize =>
  typeof value !== "undefined" &&
  typeof value?.width === "number" &&
  typeof value?.height === "number";

const boxIsSet = (box: Box): box is SetBox =>
  typeof box.w === "number" &&
  typeof box.h === "number" &&
  typeof box.x === "number" &&
  typeof box.constX === "number" &&
  typeof box.constY === "number";

export default CropBox;
