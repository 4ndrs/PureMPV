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

    pureBoxEnabled
      ? (this.pureBox = new PureBox())
      : (this.mouse = new MouseProperties());
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

      //this.animationEnabled &&
      // mp.observe_property("mouse-pos", "native", this.animateCropBox);
      printMessage("Cropping started");
    } else {
      this.calculateBox();
      this.drawBox();
      this.isCropping = false;
      printMessage("Cropping ended");
    }
  }

  setInitialMousePosition() {
    this.mouse.getProperties();
    this.x = this.mouse.x;
    this.y = this.mouse.y;
    this.constX = this.mouse.x;
    this.constY = this.mouse.y;
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
