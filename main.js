// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT
mp.add_key_binding("ctrl+w", "get-file-path", get_file_path);
mp.add_key_binding("ctrl+shift+w", "generate-preview", generate_preview);
mp.add_key_binding("ctrl+e", "get-timestamp", get_timestamp);
mp.add_key_binding("ctrl+shift+e", "set-endtime", set_endtime);
mp.add_key_binding("ctrl+c", "get-crop", get_crop);
mp.add_key_binding("ctrl+p", "toggle-puremode", toggle_puremode);

var options = {
  pure_mode: true,
  selection: "primary", // primary or clipboard, see man xclip
};
mp.options.read_options(options, "PureMPV");

var start_time = null;
var end_time = null;

var cropping = false;
var crop = {
  w: null,
  h: null,
  x: null,
  y: null,
};

function copy_to_selection(text) {
  var tmp_file = "/tmp/purempv.tmp";
  var xclip = "xclip";

  // Write the text to the tmp file for xclip
  mp.utils.write_file("file://" + tmp_file, text);

  mp.commandv("run", xclip, "-selection", options.selection, tmp_file);
  print_copy(text);

  // Clear the tmp file as it is no longer needed
  mp.utils.write_file("file://" + tmp_file, "");
}

function get_file_path() {
  var path = mp.get_property("path");
  if (!options.pure_mode) {
    copy_to_selection(path);
  } else {
    // if pure mode is on, copy the string: -i "input" -ss start_time -to end_time -lavfi crop=crop_coordinates
    var timestamps = "";
    if (start_time != null && end_time != null) {
      timestamps = "-ss " + start_time + " -to " + end_time;
    } else if (start_time != null) {
      timestamps = "-ss " + start_time;
    } else if (end_time != null) {
      timestamps = "-to " + end_time;
    }

    var input = '-i "' + path + '"';

    var crop_lavfi = "";
    if (crop["w"] != null) {
      crop_lavfi = "-lavfi crop=" + crop_txt();
    }

    copy_to_selection("ffmpeg " + input + " " + timestamps + " " + crop_lavfi);
    reset_crop();
  }
}

function get_timestamp() {
  var time_pos = mp.get_property("time-pos");
  var timestamp = new Date(time_pos * 1000).toISOString().substring(11, 23);

  if (!options.pure_mode) {
    copy_to_selection(timestamp);
  } else if (start_time == null) {
    start_time = timestamp;
    mp.osd_message("Set start time: " + start_time);
    print("Set start time: " + start_time);
  } else if (end_time == null) {
    end_time = timestamp;
    mp.osd_message("Set end time: " + end_time);
    print("Set end time: " + end_time);
  } else {
    // reset start and end times after three calls with pure mode
    start_time = null;
    end_time = null;
    mp.osd_message("Times reset");
    print("Times reset");
  }
}

// to generate -i file_path -to hh:mm:ss in pure mode
function set_endtime() {
  if (!options.pure_mode) {
    return null;
  }

  var time_pos = mp.get_property("time-pos");
  end_time = new Date(time_pos * 1000).toISOString().substring(11, 23);
  mp.osd_message("Set end time: " + end_time);
  print("Set end time: " + end_time);
}

function generate_crop() {
  var mouse = mp.get_property_native("mouse-pos");
  var x = mouse["x"];
  var y = mouse["y"];

  if (crop["x"] == null) {
    crop["x"] = Math.abs(x);
    crop["y"] = Math.abs(y);
  } else {
    // switch values if either x, or y is smaller than its counterpart in crop
    if (x < crop["x"] || y < crop["y"]) {
      crop["x"] = [x, (x = crop["x"])][0];
      crop["y"] = [y, (y = crop["y"])][0];
    }

    // generate the width and height
    crop["w"] = Math.abs(x - crop["x"]);
    crop["h"] = Math.abs(y - crop["y"]);

    // call get_crop() to copy the values (w is not null)
    get_crop();
  }
}

function get_crop() {
  if (crop["w"] == null) {
    cropping = true;
    mp.osd_message("Cropping started");
    print("Cropping started");
    generate_crop();
  } else if (!cropping) {
    // Reset crop if this is the third time we hit the function
    reset_crop();
    return null;
  } else if (!options.pure_mode) {
    copy_to_selection(crop_txt());
    drawbox();
    cropping = false;
  } else {
    drawbox();
    mp.osd_message("Cropping ended");
    print("Cropping ended");
    cropping = false;
  }
}

function generate_preview() {
  if (!options.pure_mode) {
    return null;
  }

  // Show a looping preview of the current parameters in pure mode
  var ffmpeg_params = " -f matroska -c:v libx264 -preset ultrafast -";
  var mpv_params = " mpv --loop - ";

  // mute audio in the preview if it's muted on the input
  var mute_audio = mp.get_property("mute") == "yes" ? " -an" : "";
  ffmpeg_params = mute_audio + ffmpeg_params;

  var tmp_crop =
    crop["w"] != null
      ? " -vf crop=" +
        crop["w"] +
        ":" +
        crop["h"] +
        ":" +
        crop["x"] +
        ":" +
        crop["y"]
      : "";

  var tmp_timestamp = start_time != null ? " -ss " + start_time + " " : "";
  tmp_timestamp += end_time != null ? " -to " + end_time + " " : "";
  tmp_path = mp.get_property("path");

  var preview_command =
    ' ffmpeg -hide_banner -i "' +
    tmp_path +
    '" ' +
    tmp_timestamp +
    " " +
    tmp_crop +
    " " +
    ffmpeg_params +
    "|" +
    mpv_params;

  print("Processing preview");
  mp.commandv("run", "bash", "-c", "(" + preview_command + ")");
}

function toggle_puremode() {
  if (!options.pure_mode) {
    options.pure_mode = true;
    mp.osd_message("Pure Mode: ON");
  } else {
    options.pure_mode = false;
    mp.osd_message("Pure Mode: OFF");
  }
}

function print_copy(text) {
  print("Copied: " + text);
  mp.osd_message("Copied: " + text);
}

function drawbox() {
  mp.commandv(
    "vf",
    "add",
    "@box:" +
      "drawbox=w=" +
      crop["w"] +
      ":h=" +
      crop["h"] +
      ":x=" +
      crop["x"] +
      ":y=" +
      crop["y"] +
      ":color=deeppink"
  );
}

function crop_txt() {
  // w:h:x:y
  return crop["w"] + ":" + crop["h"] + ":" + crop["x"] + ":" + crop["y"];
}

function reset_crop() {
  if (crop["x"] == null) {
    return null;
  }

  crop["w"] = null;
  crop["h"] = null;
  crop["x"] = null;
  crop["y"] = null;

  mp.commandv("vf", "remove", "@box");
}
