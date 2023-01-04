// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import { MouseProperties } from "./properties";
import { printMessage } from "./utils";
import PureBox from "./purebox";
import { Box, MousePos } from "./types";

class CropBox {
  pureBox!: PureBox;
  mouse!: MouseProperties;
  animationEnabled: boolean;
  isCropping: boolean;
  cropIsSet: boolean;

  constructor(pureBoxEnabled: boolean, animationEnabled: boolean) {
    this.animationEnabled = animationEnabled;
    this.isCropping = false;
    this.cropIsSet = false;

    if (pureBoxEnabled) {
      this.pureBox = new PureBox();
    } else {
      this.mouse = new MouseProperties();
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

  /**
   * Returns the cropBox as a string for ffmpeg's crop filter
   */
  toString() {
    return box.x !== null ? `${box.w}:${box.h}:${box.x}:${box.y}` : "";
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
