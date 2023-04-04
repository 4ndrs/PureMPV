/**
 * Returns a list of media stream urls if the source is known
 */
const getStreamUrls = (path: string) => {
  const source = getSource(path);
  const openStream = mp.get_property("stream-open-filename");

  if (typeof openStream !== "string") {
    throw new Error("Unable to retrieve the open stream");
  }

  const streams = openStream.split(";");

  switch (source) {
    case "youtube": {
      const urls = getUrls(streams, "googlevideo");
      return urls;
    }
  }
};

const getSource = (path: string) => {
  const isYoutube = path.search("youtube|youtu.be") !== -1;

  if (isYoutube) {
    return "youtube";
  }
};

const getUrls = (streams: string[], filter: string) =>
  streams.reduce<string[]>((accumulator, stream) => {
    const hasUrl = stream.match(/http[s]?:\/\/.+/);
    const matchesFilter = stream.search(filter) !== -1;

    if (matchesFilter && hasUrl) {
      return [...accumulator, hasUrl[0]];
    }

    return accumulator;
  }, []);

export { getStreamUrls };
