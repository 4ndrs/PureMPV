import { MouseProperties, VideoProperties } from "./properties";
import { printMessage } from "./utils";
import PureBox from "./purebox";
import { Box, MousePos, OSDSize, SetBox } from "./types";

import purempv from "./store";

class CropBox {
  pureBox!: PureBox;
  mouse!: MouseProperties;
  video!: VideoProperties;
  isCropping: boolean;

  constructor() {
    this.isCropping = false;

    if (purempv.options.pure_box) {
      this.pureBox = new PureBox();
    } else {
      this.mouse = new MouseProperties();
      this.video = new VideoProperties();
    }
  }

  getCrop() {
    if (purempv.options.pure_mode && !this.isCropping && boxIsSet(box)) {
      this.resetCrop();
      return;
    }

    if (this.pureBox) {
      [box.x, box.y, box.w, box.h] = this.pureBox.getCrop();
    } else {
      this.generateCrop();
    }
  }

  generateCrop() {
    if (!this.isCropping) {
      this.isCropping = true;
      this.setInitialMousePosition();

      mp.observe_property("mouse-pos", "native", animateBox);

      if (purempv.options.hide_osc_on_crop) {
        mp.command("script-message osc-visibility never");
      }

      print("Cropping started");
    } else {
      overlay.remove();
      this.normalizeCrop();

      this.isCropping = false;

      mp.unobserve_property(animateBox);

      if (purempv.options.hide_osc_on_crop) {
        mp.command("script-message osc-visibility auto");
      }

      print("Cropping ended");
    }
  }

  setInitialMousePosition() {
    this.mouse.getProperties();
    box.x = this.mouse.x;
    box.y = this.mouse.y;
    box.constX = this.mouse.x;
    box.constY = this.mouse.y;
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

    if (!boxIsSet(box)) {
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

    box.y -= Math.ceil(yBoundary / 2);
    box.x -= Math.ceil(xBoundary / 2);

    const proportion = Math.min(
      this.video.width / ratioWidth,
      this.video.height / ratioHeight
    );

    box.w = Math.ceil(box.w * proportion);
    box.h = Math.ceil(box.h * proportion);
    box.x = Math.ceil(box.x * proportion);
    box.y = Math.ceil(box.y * proportion);
  }

  /**
   * Returns the cropBox as a string for ffmpeg's crop filter
   */
  toString() {
    if (boxIsSet(box)) {
      return `${box.w}:${box.h}:${box.x}:${box.y}`;
    }
    return "";
  }

  resetCrop() {
    box.constX = null;
    box.constY = null;
    box.w = null;
    box.h = null;
    box.x = null;
    box.y = null;

    printMessage("Crop reset");
  }
}

// mp.observe_property won't work if these aren't out here
const box: Box = {
  w: null,
  h: null,
  x: null,
  y: null,
  constX: null,
  constY: null,
};

const overlay = mp.create_osd_overlay("ass-events");

const animateBox = (_name: unknown, mousePos: unknown) => {
  if (!isMousePos(mousePos)) {
    throw new Error(`Not a MousePos: ${JSON.stringify(mousePos)}`);
  }

  calculateBox(mousePos);
  drawBox();
};

const drawBox = () => {
  if (!boxIsSet(box)) {
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

  const { x, y, w: width, h: height } = box;

  const _box =
    `{\\p1}m ${x} ${y} l ${x + width} ${y} ${x + width} ` +
    `${y + height} ${x} ${y + height} {\\p0}`;

  const data = `${positionOffset}${borderColor}${fillColor}${borderWidth}${_box}`;

  overlay.data = data;
  overlay.update();
};

const calculateBox = (mousePos: MousePos) => {
  if (
    typeof box.constX !== "number" ||
    typeof box.constY !== "number" ||
    typeof box.x !== "number" ||
    typeof box.y !== "number"
  ) {
    throw new Error(`the cropbox was not initialized: ${JSON.stringify(box)}`);
  }

  let { x, y } = mousePos;

  if (x < box.constX) {
    box.x = x;
    x = box.constX;
    box.x = Math.min(x, box.x);
    box.w = x - box.x;
  } else {
    x = Math.max(x, box.x);
    box.x = Math.min(x, box.x);
    box.w = x - box.x;
  }

  if (y < box.constY) {
    box.y = y;
    y = box.constY;
    box.y = Math.min(y, box.y);
    box.h = y - box.y;
  } else {
    y = Math.max(y, box.y);
    box.y = Math.min(y, box.y);
    box.h = y - box.y;
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
