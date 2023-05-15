# PureMPV

Script to get the timestamps, cropping coordinates, and file path of the playing video, for ffmpeg, all from within mpv.

## Installation
The script currently only supports Linux, and depends on `xclip` or `wl-clipboard` to copy the data to the primary/clipboard selections. To install, change directory to your mpv scripts folder, and git clone this repository. An appropriate folder will be created:
```console
$ cd ~/.config/mpv/scripts
$ git clone https://github.com/4ndrs/PureMPV.git
```

Or if just the script is preferred without downloading the whole source code, downloading the ```main.js``` file from the repository (or one of GitHub's automatic releases) and putting it in your mpv scripts folder is enough.

Note: the ```main.js``` in the repository does not get updated on every commit. For a bleeding-edge release of the file, [click here](https://github.com/4ndrs/PureMPV/releases/download/bleeding-edge/main.js), or if cloned, see [Building](#building).

It would probably be advisable to rename the ```main.js``` file when downloaded individually to avoid conflicts with other scripts in the folder.

## Usage

[usage_preview.webm](https://github.com/4ndrs/PureMPV/assets/31898900/a6ac3832-e086-4d4e-90bd-e625578296e8)



The script by default registers the start and end times by pressing <kbd>ctrl</kbd> + <kbd>e</kbd>, and waits until the user presses <kbd>ctrl</kbd> + <kbd>w</kbd> to copy the data to the **primary** selection.

The script can copy the following by default (PureMode):

- Start & end time - <kbd>ctrl</kbd> + <kbd>e</kbd>
- End time - <kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>e</kbd>
- Cropping coordinates - <kbd>c</kbd>
- File path - <kbd>ctrl</kbd> + <kbd>w</kbd>

To copy in this mode, triggering the file path combination is necessary. If none of the above key combinations are omitted (or cancelled), the copied string will be formatted like the following:
```console
ffmpeg -ss hh:mm:ss -to hh:mm:ss -i "/path/to/file" -lavfi crop=w:h:x:y
```
When omitting key combinations, the resulting string will have the values omitted as well, for example triggering just start time, and then the file path will yield the following string:
```console
ffmpeg -ss hh:mm:ss -i "/path/to/file"
```

To get just the end time the <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>e</kbd> key combination must be pressed with **PureMode** activated.

The default mode, and the selection to copy to can be changed creating a configuration file under ```$HOME/.config/mpv/script-opts/``` with the name **PureMPV.conf**, and inserting the following:
```console
pure_mode=no
selection=clipboard
```
With the PureMode deactivated, the script will copy the resulting value of the key combination right away, without "ffmpeg -i", for example triggering <kbd>ctrl</kbd> + <kbd>e</kbd> will copy just the current timestamp, the <kbd>ctrl</kbd> + <kbd>w</kbd> will copy just the file path, and <kbd>c</kbd> will copy just the cropping coordinates.

Cropping coordinates, and set start & end times, can be cancelled by pressing their own key combination a third time.

A preview of the currently set settings can be generated pressing <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>w</kbd> in PureMode.

Output seeking can be enabled inserting ```input_seeking=no``` in the configuration file.

## Cropping
To crop, it is necessary to put the mouse pointer in the starting position of the crop. After that, pressing the keybinding <kbd>c</kbd> will start the cropping mode; position the mouse to the desired location to generate the cropping coordinates. To stop the cropping mode, press the keybinding again. The cropbox will be set if PureMode is on, and just copied if it is off.

![vivycropbox_animation](https://user-images.githubusercontent.com/31898900/185887111-207cfa6b-610f-4952-a07e-58adafe7a3f9.gif)

## Shared Data API
Other scripts can access PureMPV's internal data (cropbox and timestamps), which is available using mpv's `user-data` property. It can be requested any time using `mp.get_property_native("user-data/PureMPV")`. The returned object will have the following properties:

```typescript
interface PureMPVData {
  cropbox: {
    w: number | null;
    h: number | null;
    x: number | null;
    y: number | null;
  };

  timestamps: {
    start: string | null;
    end: string | null;
  };
}
````

An example of its usage can be seen in [pwebm-helper](https://github.com/4ndrs/pwebm-helper), which uses PureMPV's data to encode video segments.

## Keybindings summary
|Keybinding|Name|Action|
|----------|----|------|
|<kbd>ctrl</kbd> + <kbd>p</kbd>| ```toggle-puremode```| Activate/deactivate PureMode.
|<kbd>ctrl</kbd> + <kbd>w</kbd>| ```get-file-path```| Copy the file path with no formatting. <br />**PureMode**: copy the currently set parameters formatted with ffmpeg.
|<kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>w</kbd>| ```generate-preview```| **PureMode**: Generate a preview of the currently set parameters.
|<kbd>ctrl</kbd> + <kbd>e</kbd>| ```get-timestamp```| Copy the current time position with the format HH:MM:SS. <br />**PureMode**: Set the start time parameter if it is not set to the current time position, otherwise set the end time.
|<kbd>ctrl</kbd> + <kbd>shift</kbd> + <kbd>e</kbd>| ```set-endtime```| **PureMode**: Set the end time parameter regardless of whether start time is set or not.
|<kbd>c</kbd>| ```get-crop```| Trigger cropping mode, and copy the cropped coordinates in the format W:H:X:Y.  <br />**PureMode**: Trigger cropping mode, and set the cropbox parameter.

Keybindings can be changed using the names in this table and modifying your `input.conf`, or changing the relevant option key in the [configuration file](#configuration-file).

## Configuration file

The configuration file is located in ```$HOME/.config/mpv/script-opts/PureMPV.conf```, and with it, it is possible to change the following options:
|Option key|Values|Details|
|----------|----|------|
|pure_mode| yes<br>no| Specifies if PureMode will be activated when running. Default is **yes**.
|executable| executable | Specifies which program to prepend to the copied string in PureMode. Default is **ffmpeg**.
|ffmpeg_params| params| Specifies which params to append to the copied string. Default is **empty**.
|selection| primary<br>clipboard| Specifies where to copy the string. Default is **primary**.
|copy_utility| detect<br>xclip<br>wl-copy| Specifies which utility to use to copy the string. Default is **detect**.
|hide_osc_on_crop| yes<br>no| Specifies if the OSC (On Screen Controller) should be hidden when cropping. Default is **no**.
|input_seeking| yes<br>no| Specifies if input seeking should be assumed when formatting the timestamps with the inputs. Default is **yes**.
|box_color| hex color | Specifies the color of the cropbox represented as an #RRGGBB hexadecimal value. Default is **#FF1493**.


##### Keybinding options
|Option key|Details|
|----------|------|
|key_crop|  default: **c**
|key_preview|  default: **ctrl+shift+w**
|key_pure_mode|  default: **ctrl+p**
|key_file_path|  default: **ctrl+w**
|key_timestamp|  default: **ctrl+e**
|key_timestamp_end|  default: **ctrl+shift+e**

An example of the content of a configuration file could be the following:
```bash
# ~/.config/mpv/script-opts/PureMPV.conf
executable=ffmpeg
pure_mode=yes
selection=primary
input_seeking=yes
hide_osc_on_crop=yes
ffmpeg_params=-map_metadata -1 -map_chapters -1 -f webm -row-mt 1 -speed 0 -c:v libvpx-vp9 -map 0:v -crf 10 -b:v 0 -pass 1 /dev/null -y&&\

key_crop=ctrl+c
```


## Building

For building, having npm installed is necessary. To generate the ```main.js``` file with the latest changes, proceed with the following:

```console
$ npm ci
$ npm run build
```
