// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { MouseProperties } from "./properties";
import { printMessage } from "./utils";
import PureBox from "./purebox";

export default class CropBox {
  constructor(pureBoxEnabled, animationEnabled) {
    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;

    this.animationEnabled = animationEnabled;

    if (pureBoxEnabled) {
      this.pureBox = new PureBox();
    } else {
      this.mouse = new MouseProperties();
    }
  }

  getCrop() {
    // Reset cropBox if coordinates are already set
    if (this.w !== null) {
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

    // ugly code
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
    this.mouse.getProperties();
    if (this.mouse.x < this.constX) {
      this.x = this.mouse.x;
      this.mouse.x = this.constX;
      this.x = Math.min(this.mouse.x, this.x);
      this.w = this.mouse.x - this.x;
    } else {
      this.mouse.x = Math.max(this.mouse.x, this.x);
      this.x = Math.min(this.mouse.x, this.x);
      this.w = this.mouse.x - this.x;
    }

    if (this.mouse.y < this.constY) {
      this.y = this.mouse.y;
      this.mouse.y = this.constY;
      this.y = Math.min(this.mouse.y, this.y);
      this.h = this.mouse.y - this.y;
    } else {
      this.mouse.y = Math.max(this.mouse.y, this.y);
      this.y = Math.min(this.mouse.y, this.y);
      this.h = this.mouse.y - this.y;
    }
  }

  toString() {
    // Return the cropBox as a string for ffmpeg's crop filter
    return `${this.w}:${this.h}:${this.x}:${this.y}`;
  }

  drawBox() {
    const color = "deeppink";
    mp.commandv(
      "vf",
      "add",
      `@box:drawbox=w=${this.w}:h=${this.h}:x=${this.x}:y=${this.y}:color=${color}`
    );
  }

  resetCrop() {
    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;

    if (!this.pureBox) {
      // Remove the box drawn with ffmpeg filters
      mp.commandv("vf", "remove", "@box");
    }
    printMessage("Crop reset");
  }
}

// Extremely ugly code down here
// mp.observe_property won't work if these aren't out here
// Inside the class "this" is undefined somehow when it reaches
// the this.calculateBox() part in animateCropBox
var box = { w: null, h: null, x: null, y: null };
function animateBox(name, mousePos) {
  calculateBox(mousePos);
  drawBox();
}

function drawBox() {
  const color = "deeppink";
  mp.commandv(
    "vf",
    "add",
    `@box:drawbox=w=${box.w}:h=${box.h}:x=${box.x}:y=${box.y}:color=${color}`
  );
}

function calculateBox(mousePos) {
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
}
