# PureMPV

Script to get the timestamps, cropping coordinates, and file path of the playing video, for ffmpeg, all from within mpv. Additional encoding capabilities are also possible through an external utility, see [PureWebM](#purewebm) below.

## Installation
The script currently only supports Linux, and depends on xclip/wl-clipboard to copy the data to the primary/clipboard selections. To install, change directory to your mpv scripts folder, and git clone this repository. An appropriate folder will be created:
```console
$ cd ~/.config/mpv/scripts
$ git clone https://github.com/4ndrs/PureMPV.git
```

Or if just the script is preferred without downloading the whole source code, downloading the ```main.js``` file from the repository (or one of GitHub's automatic releases) and putting it in your mpv scripts folder is enough.

Note: the ```main.js``` in the repository does not get updated on every commit. For a bleeding-edge release of the file, [click here](https://github.com/4ndrs/PureMPV/releases/download/bleeding-edge/main.js), or if cloned, see [Building](#building).

It would probably be advisable to rename the ```main.js``` file when downloaded individually to avoid conflicts with other scripts in the folder.

## Usage

[usage_preview.webm](https://user-images.githubusercontent.com/31898900/202451097-d03b39ef-9661-46d9-8afc-a68b6b85c614.webm)


The script by default registers the start and end times by pressing <kbd>ctrl</kbd> + <kbd>e</kbd>, and waits until the user presses <kbd>ctrl</kbd> + <kbd>w</kbd> to copy the data to the **primary** selection.

The script can copy the following, by default (Pure Mode):

- Start time - <kbd>ctrl</kbd> + <kbd>e</kbd>
- End time - <kbd>ctrl</kbd> + <kbd>e</kbd>
- Cropping coordinates - <kbd>ctrl</kbd> + <kbd>c</kbd>
- File path - <kbd>ctrl</kbd> + <kbd>w</kbd>

To copy in this mode, triggering the file path combination is necessary. If none of the above key combinations are omitted (or cancelled), the copied string will be formatted like the following:
```console
ffmpeg -ss hh:mm:ss -to hh:mm:ss -i "/path/to/file" -lavfi crop=w:h:x:y
```
When omitting key combinations, the resulting string will have the values omitted as well, for example triggering just start time, and then the file path will yield the following string:
```console
ffmpeg -ss hh:mm:ss -i "/path/to/file"
```

To get just the end time the <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>e</kbd> key combination must be pressed with **Pure Mode** activated.

The default mode, and the selection to copy to can be changed creating a configuration file under ```$HOME/.config/mpv/script-opts/``` with the name **PureMPV.conf**, and inserting the following:
```console
pure_mode=no
selection=clipboard
```
With the Pure Mode deactivated, the script will copy the resulting value of the key combination right away, without "ffmpeg -i", for example triggering <kbd>ctrl</kbd> + <kbd>e</kbd> will copy just the current timestamp, the <kbd>ctrl</kbd> + <kbd>w</kbd> will copy just the file path, and <kbd>ctrl</kbd> + <kbd>c</kbd> will copy just the cropping coordinates.

Cropping coordinates, and set start & end times, can be cancelled by pressing their own key combination a third time.

A preview of the currently set settings can be generated pressing <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>w</kbd> in Pure Mode.

Output seeking can be enabled inserting ```input_seeking=no``` in the configuration file.

## Cropping
To crop, it is necessary to put the mouse pointer in the starting position of the crop, before pressing <kbd>ctrl</kbd> + <kbd>c</kbd>. After that, pressing the key combination will start the cropping mode, position the mouse to the desired location to generate the cropping coordinates. To stop the cropping mode, press the key combination again. The cropbox will be set if PureMode is on, and just copied if it is off.

![vivycropbox_animation](https://user-images.githubusercontent.com/31898900/185887111-207cfa6b-610f-4952-a07e-58adafe7a3f9.gif)

## PureWebM
Support for [PureWebM](https://github.com/4ndrs/PureWebM) is available setting ```pure_webm=yes``` in the configuration file. PureWebM is a wrapper for ffmpeg to make quick size restricted webms.

With PureWebM support enabled, the key bindings <kbd>ctrl</kbd>+<kbd>o</kbd>, <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>o</kbd>, and <kbd>ctrl</kbd>+<kbd>v</kbd> will be set, making it possible to make simple webms with the set parameters (<kbd>ctrl</kbd>+<kbd>o</kbd>), and with the set ```purewebm_extra_params``` in the configuration file (<kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>o</kbd>). PureWebM allows for the use of non-webm encoders setting the encoder flag with ```--extra_params```, so it is possible to set ```purewebm_extra_params``` to generate matroska containerized H.264 encoded files like the following:
```console
purewebm_extra_params=-map 0 -c copy -c:v libx264 -crf 18 -preset veryslow
```
With the above set, <kbd>ctrl</kbd>+<kbd>o</kbd> will encode simple 3MiB size restricted webms, while <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>o</kbd> will generate H.264 encoded matroska files with no size limit. If the encoder is not libvpx-vp9 or libvpx, the encoded streams will be put in an mkv. For more information refer PureWebM's repository.

The keybinding <kbd>ctrl</kbd>+<kbd>v</kbd> allows for subtitles to be burned on simple webms.

## Keybindings summary
|Keybinding|Name|Action|
|----------|----|------|
|<kbd>ctrl</kbd> + <kbd>p</kbd>| ```toggle-puremode```| Activate/deactivate PureMode.
|<kbd>ctrl</kbd> + <kbd>w</kbd>| ```get-file-path```| Copy the file path with no formatting. <br />**PureMode**: copy the currently set parameters formatted with ffmpeg.
|<kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>w</kbd>| ```generate-preview```| **PureMode**: Generate a preview of the currently set parameters.
|<kbd>ctrl</kbd> + <kbd>e</kbd>| ```get-timestamp```| Copy the current time position with the format HH:MM:SS. <br />**PureMode**: Set the start time parameter if it is not set to the current time position, otherwise set the end time.
|<kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>e</kbd>| ```set-endtime```| **PureMode**: Set the end time parameter regardless of whether start time is set or not.
|<kbd>ctrl</kbd> + <kbd>c</kbd>| ```get-crop```| Trigger cropping mode, and copy the cropped coordinates in the format W:H:X:Y.  <br />**PureMode**: Trigger cropping mode, and set the cropbox parameter.
|<kbd>ctrl</kbd> + <kbd>o</kbd>| ```purewebm```| **PureMode**: Run PureWebM with the currently set parameters.
|<kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>o</kbd>| ```purewebm-extra-params```| **PureMode**: Run PureWebM with the currently set parameters and the ```purewebm_extra_params``` in the configuration file appended.
|<kbd>ctrl</kbd> + <kbd>v</kbd>| ```toggle-burn-subs```| Activate/deactivate the burning of subtitles with PureWebM.

Keybindings can be changed using the names in this table and modifying your input.conf in```$HOME/.config/mpv/input.conf```. As an example, the following changes the keybinding <kbd>ctrl</kbd> + <kbd>c</kbd> for getting the cropping coordinates to <kbd>c</kbd>:

```bash
# Change PureMPV's keybinding ctrl-c to c
c script-binding get-crop
```

## Configuration file

The configuration file is located in ```$HOME/.config/mpv/script-opts/PureMPV.conf```, and with it, it is possible to change the following options:
|Option key|Values|Details|
|----------|----|------|
|pure_mode| yes<br>no| Specifies if PureMode will be activated when running. Default is **yes**.
|copy_mode| ffmpeg<br>purewebm| Specifies which program to prepend to the copied string in PureMode. Default is **ffmpeg**.
|pure_webm| yes<br>no| Specifies if encoding with PureWebM should be activated. Default is **no**.
|ffmpeg_params| params| Specifies which params to append to the copied string if copy_mode is ffmpeg. Default is **empty**.
|purewebm_extra_params| params| Specifies which ```--extra_params``` to send to PureWebM when encoding with <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>o</kbd>. Default is **empty**.
|selection| primary<br>clipboard| Specifies where to copy the string. Default is **primary**.
|copy_utility| detect<br>xclip<br>wl-copy| Specifies which utility to use to copy the string. Default is **detect**.
|hide_osc_on_crop| yes<br>no| Specifies if we should hide the on screen controller when in cropping mode. Default is **no**.
|input_seeking| yes<br>no| Specifies if we should assume ffmpeg input seeking in the copied string. Default is **yes**.

An example of the content of a configuration file could be the following:
```bash
# ~/.config/mpv/script-opts/PureMPV.conf
copy_mode=purewebm
pure_mode=yes
pure_webm=yes
selection=primary
input_seeking=yes
hide_osc_on_crop=yes
purewebm_extra_params=-map 0 -c copy -c:v libx264 -crf 18 -preset veryslow
ffmpeg_params=-map_metadata -1 -map_chapters -1 -f webm -row-mt 1 -speed 0 -c:v libvpx-vp9 -map 0:v -crf 10 -b:v 0 -pass 1 /dev/null -y&&\
```


## Building

For building, having npm installed is necessary. To generate the ```main.js``` file with the latest changes, proceed with the following:

```console
$ npm ci
$ npm run build
```
