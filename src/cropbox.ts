// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import { MouseProperties } from "./properties";
import { printMessage } from "./utils";
import PureBox from "./purebox";
import { MousePos } from "./types";

class CropBox {
  w: number | null;
  h: number | null;
  x: number | null;
  y: number | null;
  constX: number | null;
  constY: number | null;
  pureBox!: PureBox;
  mouse!: MouseProperties;
  animationEnabled: boolean;
  isCropping: boolean;
  overlay!: mp.OSDOverlay;

  constructor(pureBoxEnabled: boolean, animationEnabled: boolean) {
    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;

    this.animationEnabled = animationEnabled;
    this.isCropping = false;

    if (pureBoxEnabled) {
      this.pureBox = new PureBox();
    } else {
      this.mouse = new MouseProperties();
      this.overlay = mp.create_osd_overlay("ass-events");
    }
  }

  getCrop(pureMode: boolean) {
    // Reset cropBox if coordinates are already set, and we are in PureMode
    if (this.w !== null && pureMode) {
      this.resetCrop();
      return;
    }

    if (this.pureBox) {
      [this.x, this.y, this.w, this.h] = this.pureBox.getCrop();
    } else {
      this.generateCrop();
    }
  }

  generateCrop() {
    if (!this.isCropping) {
      this.isCropping = true;
      this.setInitialMousePosition();

      if (this.animationEnabled) {
        mp.observe_property("mouse-pos", "native", animateBox);
      }

      printMessage("Cropping started");
    } else {
      this.calculateBox();
      this.drawBox();
      this.isCropping = false;

      if (this.animationEnabled) {
        mp.unobserve_property(animateBox);
      }

      printMessage("Cropping ended");
    }
  }

  animateCropBox() {
    this.calculateBox();
    this.drawBox();
  }

  setInitialMousePosition() {
    this.mouse.getProperties();
    this.x = this.mouse.x;
    this.y = this.mouse.y;
    this.constX = this.mouse.x;
    this.constY = this.mouse.y;

    // TODO: remove, see the hack below
    if (this.animationEnabled) {
      [box.w, box.h, box.x, box.y, box.constX, box.constY] = [
        this.w,
        this.h,
        this.x,
        this.y,
        this.constX,
        this.constY,
      ];
    }
  }

  calculateBox() {
    this.mouse.getProperties(); // TODO: not inferring types, need rework
    if ((this.mouse.x as number) < (this.constX as number)) {
      this.x = this.mouse.x;
      this.mouse.x = this.constX;
      this.x = Math.min(this.mouse.x as number, this.x as number);
      this.w = (this.mouse.x as number) - this.x;
    } else {
      this.mouse.x = Math.max(this.mouse.x as number, this.x as number);
      this.x = Math.min(this.mouse.x, this.x as number);
      this.w = this.mouse.x - this.x;
    }

    if ((this.mouse.y as number) < (this.constY as number)) {
      this.y = this.mouse.y;
      this.mouse.y = this.constY;
      this.y = Math.min(this.mouse.y as number, this.y as number);
      this.h = (this.mouse.y as number) - this.y;
    } else {
      this.mouse.y = Math.max(this.mouse.y as number, this.y as number);
      this.y = Math.min(this.mouse.y, this.y as number);
      this.h = this.mouse.y - this.y;
    }
  }

  toString() {
    // Return the cropBox as a string for ffmpeg's crop filter
    return `${this.w}:${this.h}:${this.x}:${this.y}`;
  }

  drawBox() {
    const deepPink = "9314FF"; // 0xFF1493
    const borderColor = `{\\3c&${deepPink}&}`;
    const fillColor = "{\\1a&FF&}";
    const borderWidth = "{\\bord6}";
    const scale = "{\\fscx200\\fscy200}";
    const positionOffset = "{\\pos(0, 0)}";

    const { x, y, width, height } = {
      x: this.x as number,
      y: this.y as number,
      width: this.w as number,
      height: this.h as number,
    };

    const box =
      `{\\p1}m ${x} ${y} l ${x + width} ${y} ${x + width} ` +
      `${y + height} ${x} ${y + height} {\\p0}`;

    const data = `${positionOffset}${scale}${borderColor}${fillColor}${borderWidth}${box}`;

    overlay.data = data;
    overlay.update();
  }

  resetCrop() {
    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;

    if (!this.pureBox) {
      this.overlay.remove();
      overlay.remove(); // TODO: remove, see hack below
    }
    printMessage("Crop reset");
  }
}

// TODO: this is a hack, need to find a better solution
// Extremely ugly code down here
// mp.observe_property won't work if these aren't out here
// Inside the class "this" is undefined somehow when it reaches
// the this.calculateBox() part in animateCropBox
type Box = { [id: string]: number | null };
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
  const borderWidth = "{\\bord6}";
  const scale = "{\\fscx200\\fscy200}";
  const positionOffset = "{\\pos(0, 0)}";

  const { x, y, width, height } = {
    x: box.x as number,
    y: box.y as number,
    width: box.w as number,
    height: box.h as number,
  };

  const box2 =
    `{\\p1}m ${x} ${y} l ${x + width} ${y} ${x + width} ` +
    `${y + height} ${x} ${y + height} {\\p0}`;

  const data = `${positionOffset}${scale}${borderColor}${fillColor}${borderWidth}${box2}`;

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
