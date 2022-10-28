// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/* global mp */

export function getStreamUrls(path) {
  // Returns a list of media stream urls if the source is known
  const source = getSource(path);

  switch (source) {
    case "youtube": {
      const streams = mp.get_property("stream-open-filename").split(";");
      let urls = [];

      for (const stream of streams) {
        stream.search("googlevideo") !== -1 &&
          urls.push(stream.match(/http.*/)[0]);
      }
      return urls;
    }

    default:
      return;
  }
}

function getSource(path) {
  const isYoutube = path.search("youtube|youtu.be") !== -1;

  if (isYoutube) {
    return "youtube";
  }
}
