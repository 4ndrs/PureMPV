# PureMPV

Script to get the timestamps, cropping coordinates, and file path of the playing video, for ffmpeg, all from within mpv. Additional encoding capabilities are also possible through an external utility, see [PureWebM](#purewebm) below.

## Usage

[vivy_test](https://user-images.githubusercontent.com/31898900/186554920-6ae33c4a-e510-4109-87f4-17ec1f19ca51.webm)


The script by default registers the start and end times by pressing <kbd>ctrl</kbd> + <kbd>e</kbd>, and waits until the user presses <kbd>ctrl</kbd> + <kbd>w</kbd> to copy the data to the primary X selection.

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
To crop, it is necessary to put the mouse pointer in the starting position of the crop, before pressing <kbd>ctrl</kbd> + <kbd>c</kbd>. After that, position the mouse to the desired location to generate the cropping coordinates. A box will be drawn with ffmpeg filters, it only works if hwdec is set to auto-copy, or disabled. Animation for the crop box is available if desired, it can be enabled inserting ```cropbox_animation=yes``` in the configuration file. The box will be removed after cancelling the crop.

![vivycropbox_animation](https://user-images.githubusercontent.com/31898900/185887111-207cfa6b-610f-4952-a07e-58adafe7a3f9.gif)

## PureBox
An alternative to drawing the cropbox with ffmpeg filters is using [PureBox](https://github.com/4ndrs/PureBox), which can be activated setting ```pure_box=yes``` in the configuration file. PureBox uses Xlib to draw the box on the window, which is much faster, less resource intensive, and works with hwdec=yes. It can be installed using pip:
```console
$ pip install purebox
```
or
```console
$ git clone https://github.com/4ndrs/PureBox.git
$ cd PureBox
$ pip install .
```

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


## Installation
The script currently only supports Linux. To install, change directory to your mpv scripts folder, and git clone this repository. An appropriate folder will be created:
```console
$ cd ~/.config/mpv/scripts
$ git clone https://github.com/4ndrs/PureMPV.git
```

Or if just the script is preferred without downloading the whole source code, downloading the ```main.js``` file and putting it in your mpv scripts folder is enough.

## Building

For building, having npm installed is necessary. This project uses Babel for transpiling and Rollup for bundling. To generate the ```main.js``` file with the latest changes, proceed with the following:

```console
$ npm ci

added 284 packages, and audited 285 packages in 944ms

35 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

$ npm run build

> purempv@0.1.0 build
> rollup -c

src/purempv.js → main.js...
created main.js in 623ms
```
