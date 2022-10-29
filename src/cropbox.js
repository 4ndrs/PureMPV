// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { printMessage } from "./utils";

export default class CropBox {
  constructor() {
    this.isCropping = false;
    this.constX = null;
    this.constY = null;
    this.w = null;
    this.h = null;
    this.x = null;
    this.y = null;
  }

  toString() {
    // Return the cropBox as a string for ffmpeg's crop filter
    return `${this.w}:${this.h}:${this.x}:${this.y}`;
  }

  resetCrop(pureBox) {
    [this.constX, this.constY, this.w, this.h, this.x, this.y] =
      Array(6).fill(null);

    if (!pureBox) {
      // Remove the box drawn with ffmpeg filters
      mp.commandv("vf", "remove", "@box");
    }

    printMessage("Crop reset");
  }
}
