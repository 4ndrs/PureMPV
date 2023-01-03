// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

import { VideoProperties, MouseProperties } from "./properties";

class PureBox {
  video: VideoProperties;
  mouse: MouseProperties;
  pid: number;

  constructor() {
    this.video = new VideoProperties();
    this.mouse = new MouseProperties();
    this.pid = mp.utils.getpid();
  }

  getCrop() {
    this.video.getProperties(); // TODO: not inferring types, need rework
    this.mouse.getProperties();

    const pureBoxProcess = mp.command_native({
      name: "subprocess",
      args: [
        "purebox",
        this.pid.toString(),
        (this.mouse.x as number).toString(),
        (this.mouse.y as number).toString(),
        (this.video.width as number).toString(),
        (this.video.height as number).toString(),
      ],
      capture_stdout: true,
    }) as { status: number; stdout: string };

    if (pureBoxProcess.status !== 0) {
      throw new Error("An error occurred during the execution of PureBox");
    }

    return pureBoxProcess.stdout
      .split(", ")
      .map((coordinate) => Number(coordinate));
  }
}

export default PureBox;
