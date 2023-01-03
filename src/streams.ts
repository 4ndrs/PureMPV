// Copyright (c) 2022-2023 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Returns a list of media stream urls if the source is known
 */
const getStreamUrls = (path: string) => {
  const source = getSource(path);

  switch (source) {
    case "youtube": {
      const streams = (mp.get_property("stream-open-filename") as string).split(
        ";"
      );

      const urls = [];
      for (const stream of streams) {
        if (stream.search("googlevideo") !== -1) {
          const match = stream.match(/http.*/);
          if (match !== null) {
            urls.push(match[0]);
          }
        }
      }
      return urls;
    }

    default:
      return;
  }
};

const getSource = (path: string) => {
  const isYoutube = path.search("youtube|youtu.be") !== -1;

  if (isYoutube) {
    return "youtube";
  }
};

export { getStreamUrls };
