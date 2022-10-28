// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

import { VideoProperties, MouseProperties } from "./properties";
import { DEBUG } from "./env";

export default class PureBox {
  constructor() {
    this.video = new VideoProperties();
    this.mouse = new MouseProperties();
    this.pid = mp.utils.getpid();
  }

  getCrop() {
    this.video.getProperties();
    this.mouse.getProperties();

    DEBUG &&
      print(
        "DEBUG: PUREBOX INITIAL VALUES:",
        this.video.width.toString(),
        this.video.height.toString(),
        this.mouse.x.toString(),
        this.mouse.y.toString()
      );

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

    DEBUG && print(`DEBUG: PUREBOX STATUS: ${pureBoxProcess.status}`);
    DEBUG && print(`DEBUG: PUREBOX RESULTS: ${pureBoxProcess.stdout}`);

    if (pureBoxProcess.status == 0) {
      return pureBoxProcess.stdout.split(", ");
    }
  }
}
