// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { printMessage } from "./utils";
import PureBox from "./purebox";

export default class CropBox {
  constructor(pureBoxEnabled) {
    this.isCropping = false;

    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;

    pureBoxEnabled && (this.pureBox = new PureBox());
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
      // TODO
      return;
    }
  }

  toString() {
    // Return the cropBox as a string for ffmpeg's crop filter
    return `${this.w}:${this.h}:${this.x}:${this.y}`;
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
