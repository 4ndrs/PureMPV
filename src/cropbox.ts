// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import { MouseProperties, VideoProperties } from "./properties";
import { printMessage } from "./utils";
import PureBox from "./purebox";
import { Box, MousePos } from "./types";

class CropBox {
  pureBox!: PureBox;
  mouse!: MouseProperties;
  video!: VideoProperties;
  isCropping: boolean;
  cropIsSet: boolean;

  constructor(pureBoxEnabled: boolean) {
    this.isCropping = false;
    this.cropIsSet = false;

    if (pureBoxEnabled) {
      this.pureBox = new PureBox();
    } else {
      this.mouse = new MouseProperties();
      this.video = new VideoProperties();
    }
  }

  /**
   * Reset cropBox if coordinates are already set, and we are in PureMode
   */
  getCrop(pureMode: boolean) {
    if (this.cropIsSet && pureMode) {
      this.resetCrop();
      return;
    }

    if (this.pureBox) {
      [box.x, box.y, box.w, box.h] = this.pureBox.getCrop();
      this.cropIsSet = true;
    } else {
      this.generateCrop();
    }
  }

  generateCrop() {
    if (!this.isCropping) {
      this.isCropping = true;
      this.setInitialMousePosition();

      mp.observe_property("mouse-pos", "native", animateBox);

      print("Cropping started");
    } else {
      overlay.remove();
      this.normalizeCrop();
      this.isCropping = false;
      this.cropIsSet = true;

      mp.unobserve_property(animateBox);

      print("Cropping ended");
    }
  }

  animateCropBox() {
    this.mouse.getProperties(); // TODO: not inferring types, need rework
    calculateBox({ x: this.mouse.x as number, y: this.mouse.y as number });
    drawBox();
  }

  setInitialMousePosition() {
    this.mouse.getProperties();
    box.x = this.mouse.x;
    box.y = this.mouse.y;
    box.constX = this.mouse.x;
    box.constY = this.mouse.y;
  }

  normalizeCrop() {
    this.video.getProperties();
    const osdSize = mp.get_osd_size();

    if (
      typeof this.video.height !== "number" ||
      typeof this.video.width !== "number"
    ) {
      throw new Error("Unable to get the video's properties");
    }

    if (
      osdSize === undefined ||
      osdSize.width === undefined ||
      osdSize.height === undefined
    ) {
      throw new Error("Unable to get the OSD sizes");
    }

    if (box.w === null || box.h === null || box.x === null || box.y === null) {
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
    if (this.cropIsSet) {
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

    this.cropIsSet = false;

    if (!this.pureBox) {
      overlay.remove();
    }

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
  const deepPink = "9314FF"; // 0xFF1493
  const borderColor = `{\\3c&${deepPink}&}`;
  const fillColor = "{\\1a&FF&}";
  const borderWidth = "{\\bord4}";
  const positionOffset = "{\\pos(0, 0)}";

  const osdSize = mp.get_osd_size();

  if (
    osdSize !== undefined &&
    osdSize.width !== undefined &&
    osdSize.height !== undefined
  ) {
    ({ width: overlay.res_x, height: overlay.res_y } = osdSize);
  } else {
    mp.msg.error(
      "ERROR: Couldn't get the OSD size.The drawn cropbox might be incorrect."
    );
  }

  const { x, y, width, height } = {
    x: box.x as number,
    y: box.y as number,
    width: box.w as number,
    height: box.h as number,
  };

  const _box =
    `{\\p1}m ${x} ${y} l ${x + width} ${y} ${x + width} ` +
    `${y + height} ${x} ${y + height} {\\p0}`;

  const data = `${positionOffset}${borderColor}${fillColor}${borderWidth}${_box}`;

  overlay.data = data;
  overlay.update();
};

const calculateBox = (mousePos: MousePos) => {
  let { x, y } = mousePos;
  if (x < (box.constX as number)) {
    box.x = x;
    x = box.constX as number;
    box.x = Math.min(x, box.x);
    box.w = x - box.x;
  } else {
    x = Math.max(x, box.x as number);
    box.x = Math.min(x, box.x as number);
    box.w = x - box.x;
  }

  if (y < (box.constY as number)) {
    box.y = y;
    y = box.constY as number;
    box.y = Math.min(y, box.y);
    box.h = y - box.y;
  } else {
    y = Math.max(y, box.y as number);
    box.y = Math.min(y, box.y as number);
    box.h = y - box.y;
  }
};

const isMousePos = (value: unknown): value is MousePos =>
  (value as MousePos)?.x !== undefined && (value as MousePos)?.y !== undefined;

export default CropBox;
