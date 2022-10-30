// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

export class VideoProperties {
  constructor() {
    this.width = null;
    this.height = null;
  }

  getProperties() {
    this.width = mp.get_property("width");
    this.height = mp.get_property("height");
  }
}

export class MouseProperties {
  constructor() {
    this.x = null;
    this.y = null;
  }

  getProperties() {
    const { x, y } = mp.get_property_native("mouse-pos");
    [this.x, this.y] = [x, y];
  }
}
