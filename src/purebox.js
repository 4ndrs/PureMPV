// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { VideoProperties, MouseProperties } from "./properties";

export default class PureBox {
  constructor() {
    this.video = new VideoProperties();
    this.mouse = new MouseProperties();
    this.pid = mp.utils.getpid();
  }

  getCrop() {
    this.video.getProperties();
    this.mouse.getProperties();

    const pureBoxProcess = mp.command_native({
      name: "subprocess",
      args: [
        "purebox",
        this.pid.toString(),
        this.mouse.x.toString(),
        this.mouse.y.toString(),
        this.video.width.toString(),
        this.video.height.toString(),
      ],
      capture_stdout: true,
    });

    if (pureBoxProcess.status == 0) {
      return pureBoxProcess.stdout.split(", ");
    }
  }
}
