import PureMPV from "./purempv";

const PATH = "user-data/PureMPV";

const updateSharedData = () => {
  const cropbox = {
    w: PureMPV.cropBox.w,
    h: PureMPV.cropBox.h,
    x: PureMPV.cropBox.x,
    y: PureMPV.cropBox.y,
  };

  const timestamps = {
    start: PureMPV.timestamps.start,
    end: PureMPV.timestamps.end,
  };

  mp.set_property_native(PATH, { cropbox, timestamps });
};

export { updateSharedData };
