// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import { MousePos } from "./types";

class VideoProperties {
  width: number | null;
  height: number | null;

  constructor() {
    this.width = null;
    this.height = null;
  }

  getProperties() {
    this.width = mp.get_property_native("width") as number;
    this.height = mp.get_property_native("height") as number;
  }
}

class MouseProperties {
  x: number | null;
  y: number | null;

  constructor() {
    this.x = null;
    this.y = null;
  }

  getProperties() {
    ({ x: this.x, y: this.y } = mp.get_property_native(
      "mouse-pos"
    ) as MousePos);
  }
}

export { MouseProperties, VideoProperties };
