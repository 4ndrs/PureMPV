// Copyright (c) 2022 4ndrs <andres.degozaru@gmail.com>
// SPDX-License-Identifier: MIT
mp.add_key_binding("ctrl+w", "get-file-path", get_file_path);
mp.add_key_binding("ctrl+shift+w", "generate-preview", generate_preview);
mp.add_key_binding("ctrl+e", "get-timestamp", get_timestamp);
mp.add_key_binding("ctrl+shift+e", "set-endtime", set_endtime);
mp.add_key_binding("ctrl+c", "get-crop", get_crop);
mp.add_key_binding("ctrl+p", "toggle-puremode", toggle_puremode);

var options = {
  copy_mode: "ffmpeg",
  pure_mode: true,
  pure_box: false,
  pure_webm: false,
  purewebm_params: "",
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

if (options.pure_webm) {
  mp.add_key_binding("ctrl+o", "purewebm", encode_purewebm);
  mp.add_key_binding("ctrl+shift+o", "purewebm-params", encode_purewebm_params);
  mp.add_key_binding("ctrl+v", "toggle-burn-subs", toggle_burn_subs);
  var burn_subs = false;
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

function encode_purewebm() {
  // Runs PureWebM with the set instructions
  get_file_path(true, false);
}

function encode_purewebm_params() {
  // Runs PureWebM with the set instructions plus purewebm_params
  get_file_path(true, true);
}

function toggle_burn_subs() {
  if (burn_subs) {
    burn_subs = false;
    mp.osd_message("Burn subtitles: no");
  } else {
    burn_subs = true;
    mp.osd_message("Burn subtitles: yes");
  }
}

function get_crop_purebox() {
  if (crop["w"] != null) {
    // just reset the crop if it already has been set
    reset_crop();
    return null;
  }

  var video_width = mp.get_property("width");
  var video_height = mp.get_property("height");
  var mouse = mp.get_property_native("mouse-pos");
  var pid = mp.utils.getpid();
  var x = mouse["x"];
  var y = mouse["y"];

  var purebox = mp.command_native({
    name: "subprocess",
    args: [
      "purebox",
      pid.toString(),
      x.toString(),
      y.toString(),
      video_width.toString(),
      video_height.toString(),
    ],
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

function get_file_path(purewebm, purewebm_params) {
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
          if (!purewebm) {
            // copy each url with -i prepended to input
            input.push('-i "' + urls[i].match(/http.*/)[0] + '"');
          } else {
            input.push("-i");
            input.push(urls[i].match(/http.*/)[0]);
          }
        }
      }
    } else {
      if (!purewebm) {
        input.push('-i "' + path + '"');
      } else {
        input.push("-i");
        input.push(path);
      }
    }

    var crop_lavfi = "";
    if (crop["w"] != null) {
      crop_lavfi = "-lavfi crop=" + crop_txt() + " ";
    }

    if (purewebm) {
      command = ["purewebm"].concat(input);

      if (crop_lavfi) {
        command = command.concat(crop_lavfi.trim().split(" "));
      }
      if (!purewebm_params && burn_subs) {
        command = command.concat(["-subs"]);
      }
      if (timestamps) {
        command = command.concat(timestamps.trim().split(" "));
      }
      if (purewebm_params) {
        command = command.concat(["--extra_params", options.purewebm_params]);
      }

      mp.command_native({
        name: "subprocess",
        args: command,
        detach: true,
      });
    } else if (options.input_seeking) {
      var timestamps_inputs = "";
      // prepend timestamps to each input
      for (var i = 0; i < input.length; i++) {
        timestamps_inputs += " " + timestamps + input[i];
      }
      switch (options.copy_mode) {
        case "ffmpeg":
          copy_to_selection(
            "ffmpeg" +
              timestamps_inputs +
              " " +
              crop_lavfi +
              options.ffmpeg_params
          );
          break;
        case "purewebm":
          copy_to_selection("purewebm" + timestamps_inputs + " " + crop_lavfi);
          break;
      }
    } else {
      var inputs = "";
      for (var i = 0; i < input.length; i++) {
        inputs += " " + input[i];
      }
      switch (options.copy_mode) {
        case "ffmpeg":
          copy_to_selection(
            "ffmpeg" +
              inputs +
              " " +
              timestamps +
              crop_lavfi +
              options.ffmpeg_params
          );
          break;
        case "purewebm":
          copy_to_selection(
            "purewebm" + inputs + " " + timestamps + crop_lavfi
          );
          break;
      }
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
    "-map_metadata -1 -map_chapters -1" + mute_audio + ffmpeg_params;

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

  // Generate mappings with the number of inputs
  var mappings = "";
  for (var i = 0; i < tmp_input.length; i++) {
    mappings += " -map " + i + ":v? -map " + i + ":a? ";
  }

  ffmpeg_params = mappings + ffmpeg_params;

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

  if (!options.pure_box) {
    mp.commandv("vf", "remove", "@box");
  }

  print("Crop reset");
  mp.osd_message("Crop reset");
}
