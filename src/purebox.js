// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

export default class PureBox {
  constructor() {
    this.video = {
      width: mp.get_property("width"),
      height: mp.get_property("height"),
    };

    this.pid = mp.utils.getpid();
  }

  getCrop() {
    [this.x, this.y] = mp.get_property_native("mouse-pos");

    const pureBoxProcess = mp.command_native({
      name: "subprocess",
      args: [
        "purebox",
        this.pid.toString(),
        this.x.toString(),
        this.y.toString(),
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
