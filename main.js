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
  pure_box: false,
  ffmpeg_params: "",
  input_seeking: true,
  selection: "primary", // primary or clipboard, see man xclip
  cropbox_animation: false,
};
mp.options.read_options(options, "PureMPV");

if (!options.pure_mode) {
  mp.remove_key_binding("generate-preview");
  mp.remove_key_binding("set-endtime");
}

if (options.pure_box) {
  mp.remove_key_binding("get-crop");
  mp.add_key_binding("ctrl+c", "get-crop", get_crop_purebox);
}

var start_time = null;
var end_time = null;

var cropping = false;
var const_x = null;
var const_y = null;
var crop = {
  w: null,
  h: null,
  x: null,
  y: null,
};

function get_crop_purebox() {
  var mouse = mp.get_property_native("mouse-pos");
  var pid = mp.utils.getpid();
  var x = mouse["x"];
  var y = mouse["y"];

  var purebox = mp.command_native({
    name: "subprocess",
    args: ["purebox", pid.toString(), x.toString(), y.toString()],
    capture_stdout: true,
  });

  if (purebox.status == 0) {
    purebox = purebox.stdout.split(", ");
    crop["x"] = purebox[0];
    crop["y"] = purebox[1];
    crop["w"] = purebox[2];
    crop["h"] = purebox[3];

    if (!options.pure_mode) {
      copy_to_selection(crop_txt());
    }
  }
}

function copy_to_selection(text) {
  selection = options.selection == "primary" ? "primary" : "clipboard";
  mp.commandv(
    "run",
    "bash",
    "-c",
    "(echo -n '" + text + "'| xclip" + " -selection " + selection + ")"
  );
  print_copy(text);
}

function get_file_path() {
  var path = mp.get_property("path");
  if (!options.pure_mode) {
    copy_to_selection(path);
  } else {
    // if pure mode is on, copy the string: -ss start_time -to end_time -i "input" -lavfi crop=crop_coordinates
    var timestamps = "";
    if (start_time != null && end_time != null) {
      timestamps = "-ss " + start_time + " -to " + end_time + " ";
    } else if (start_time != null) {
      timestamps = "-ss " + start_time + " ";
    } else if (end_time != null) {
      timestamps = "-to " + end_time + " ";
    }

    var input = [];
    // if path starts with http and is a YT link copy the stream media urls
    if (
      path.match(/^http/) &&
      (path.indexOf("youtube") !== -1 || path.indexOf("youtu.be") !== -1)
    ) {
      var urls = mp.get_property("stream-open-filename").split(";");
      for (var i = 0; i < urls.length; i++) {
        if (urls[i].indexOf("googlevideo") !== -1) {
          // copy each url with -i prepended to input
          input.push('-i "' + urls[i].match(/http.*/)[0] + '"');
        }
      }
    } else {
      input.push('-i "' + path + '"');
    }

    var crop_lavfi = "";
    if (crop["w"] != null) {
      crop_lavfi = "-lavfi crop=" + crop_txt() + " ";
    }

    if (options.input_seeking) {
      var timestamps_inputs = "";
      // prepend timestamps to each input
      for (var i = 0; i < input.length; i++) {
        timestamps_inputs += " " + timestamps + input[i];
      }
      copy_to_selection(
        "ffmpeg" + timestamps_inputs + " " + crop_lavfi + options.ffmpeg_params
      );
    } else {
      var inputs = "";
      for (var i = 0; i < input.length; i++) {
        inputs += " " + input[i];
      }
      copy_to_selection(
        "ffmpeg" +
          inputs +
          " " +
          timestamps +
          crop_lavfi +
          options.ffmpeg_params
      );
    }
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
    crop["x"] = x;
    crop["y"] = y;
    const_x = x;
    const_y = y;
  } else {
    if (x < const_x) {
      crop["x"] = x;
      x = const_x;
      crop["x"] = Math.min(x, crop["x"]);
      crop["w"] = x - crop["x"];
    } else {
      x = Math.max(x, crop["x"]);
      crop["x"] = Math.min(x, crop["x"]);
      crop["w"] = x - crop["x"];
    }

    if (y < const_y) {
      crop["y"] = y;
      y = const_y;
      crop["y"] = Math.min(y, crop["y"]);
      crop["h"] = y - crop["y"];
    } else {
      y = Math.max(y, crop["y"]);
      crop["y"] = Math.min(y, crop["y"]);
      crop["h"] = y - crop["y"];
    }

    // call get_crop() to copy the values (w is not null)
    get_crop();
  }
}

function get_crop() {
  if (crop["w"] == null) {
    if (!cropping) {
      mp.osd_message("Cropping started");
      print("Cropping started");
      if (options.cropbox_animation) {
        mp.observe_property("mouse-pos", "native", animate_cropbox);
      }
      cropping = true;
    }
    generate_crop();
  } else if (!cropping) {
    // Reset crop if this is the third time we hit the function
    reset_crop();
    return null;
  } else if (!options.pure_mode) {
    copy_to_selection(crop_txt());
    if (options.cropbox_animation) {
      mp.unobserve_property(animate_cropbox);
    }
    drawbox();
    cropping = false;
  } else {
    if (options.cropbox_animation) {
      mp.unobserve_property(animate_cropbox);
    }
    drawbox();
    mp.osd_message("Cropping ended");
    print("Cropping ended");
    cropping = false;
  }
}

function generate_preview() {
  // TODO: refactor, merge with get file path

  if (!options.pure_mode) {
    return null;
  }

  // Show a looping preview of the current parameters in pure mode
  var ffmpeg_params = " -f matroska -c:v libx264 -preset ultrafast - ";
  var mpv_params = " mpv --loop - ";

  // mute audio in the preview if it's muted on the input
  var mute_audio = mp.get_property("mute") == "yes" ? " -an" : "";
  ffmpeg_params =
    " -map 0:v? -map 0:a? -map 1:a? -map 1:v? -map_metadata -1 -map_chapters -1" +
    mute_audio +
    ffmpeg_params;

  var tmp_crop =
    crop["w"] != null
      ? " -vf crop=" +
        crop["w"] +
        ":" +
        crop["h"] +
        ":" +
        crop["x"] +
        ":" +
        crop["y"] +
        " "
      : "";

  var tmp_timestamp = start_time != null ? " -ss " + start_time + " " : "";
  tmp_timestamp += end_time != null ? " -to " + end_time + " " : "";

  tmp_path = mp.get_property("path");

  var tmp_input = [];
  if (
    tmp_path.match(/^http/) &&
    (tmp_path.indexOf("youtube") !== -1 || tmp_path.indexOf("youtu.be") !== -1)
  ) {
    var tmp_urls = mp.get_property("stream-open-filename").split(";");
    for (var i = 0; i < tmp_urls.length; i++) {
      if (tmp_urls[i].indexOf("googlevideo") !== -1) {
        tmp_input.push('-i "' + tmp_urls[i].match(/http.*/)[0] + '"');
      }
    }
  } else {
    tmp_input.push('-i "' + tmp_path + '"');
  }

  var preview_command = "";
  if (options.input_seeking) {
    var tmp_timestamps_inputs = "";
    for (var i = 0; i < tmp_input.length; i++) {
      tmp_timestamps_inputs += " " + tmp_timestamp + tmp_input[i];
    }
    preview_command =
      "ffmpeg -hide_banner" +
      tmp_timestamps_inputs +
      tmp_crop +
      ffmpeg_params +
      "|" +
      mpv_params;
  } else {
    var tmp_inputs = "";
    for (var i = 0; i < tmp_input.length; i++) {
      tmp_inputs += " " + tmp_input[i];
    }
    preview_command =
      "ffmpeg -hide_banner" +
      tmp_inputs +
      tmp_timestamp +
      tmp_crop +
      ffmpeg_params +
      "|" +
      mpv_params;
  }

  print("Processing preview");
  mp.osd_message("Processing preview");
  mp.commandv("run", "bash", "-c", "(" + preview_command + ")");
}

function toggle_puremode() {
  if (!options.pure_mode) {
    options.pure_mode = true;
    mp.add_key_binding("ctrl+shift+w", "generate-preview", generate_preview);
    mp.add_key_binding("ctrl+shift+e", "set-endtime", set_endtime);
    mp.osd_message("Pure Mode: ON");
  } else {
    options.pure_mode = false;
    mp.remove_key_binding("generate-preview");
    mp.remove_key_binding("set-endtime");
    mp.osd_message("Pure Mode: OFF");
  }
}

function print_copy(text) {
  print("Copied to " + options.selection + ": " + text);
  mp.osd_message("Copied to " + options.selection + ": " + text);
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

function animate_cropbox(name, tmp_mouse) {
  if (const_x == null || const_y == null) {
    return null;
  }

  var tmp_x = tmp_mouse["x"];
  var tmp_y = tmp_mouse["y"];

  var tmp_crop = {
    w: null,
    h: null,
    x: crop["x"],
    y: crop["y"],
  };

  if (tmp_x < const_x) {
    tmp_crop["x"] = tmp_x;
    tmp_x = const_x;
    tmp_crop["x"] = Math.min(tmp_x, tmp_crop["x"]);
    tmp_crop["w"] = tmp_x - tmp_crop["x"];
  } else {
    tmp_x = Math.max(tmp_x, tmp_crop["x"]);
    tmp_crop["x"] = Math.min(tmp_x, tmp_crop["x"]);
    tmp_crop["w"] = tmp_x - tmp_crop["x"];
  }

  if (tmp_y < const_y) {
    tmp_crop["y"] = tmp_y;
    tmp_y = const_y;
    tmp_crop["y"] = Math.min(tmp_y, tmp_crop["y"]);
    tmp_crop["h"] = tmp_y - tmp_crop["y"];
  } else {
    tmp_y = Math.max(tmp_y, tmp_crop["y"]);
    tmp_crop["y"] = Math.min(tmp_y, tmp_crop["y"]);
    tmp_crop["h"] = tmp_y - tmp_crop["y"];
  }

  mp.commandv(
    "vf",
    "add",
    "@box:" +
      "drawbox=w=" +
      tmp_crop["w"] +
      ":h=" +
      tmp_crop["h"] +
      ":x=" +
      tmp_crop["x"] +
      ":y=" +
      tmp_crop["y"] +
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

  const_x = null;
  const_y = null;

  mp.commandv("vf", "remove", "@box");
}
