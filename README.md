# PureMPV

Script to get the timestamps, cropping coordinates, and file path of the playing video, all within mpv.

## Usage

[vivy test](https://user-images.githubusercontent.com/31898900/185803404-352b8ff6-06f5-4fa7-9ea6-076cf153b002.mp4)

The script by default registers the start and end times by pressing <kbd>ctrl</kbd> + <kbd>e</kbd>, and waits until the user presses <kbd>ctrl</kbd> + <kbd>w</kbd> to copy the data to the primary X selection.

The script can copy the following, by default (Pure Mode):

- Start time - <kbd>ctrl</kbd> + <kbd>e</kbd>
- End time - <kbd>ctrl</kbd> + <kbd>e</kbd>
- Cropping coordinates - <kbd>ctrl</kbd> + <kbd>c</kbd>
- File path - <kbd>ctrl</kbd> + <kbd>w</kbd>

To copy in this mode, triggering the file path combination is necessary. If none of the above key combinations are omitted (or cancelled), the copied string will be formatted like the following:
```bash
ffmpeg -i "/path/to/file" -ss hh:mm:ss -to hh:mm:ss -vf crop=w:h:x:y
```
When omitting key combinations, the resulting string will have the values omitted as well, for example triggering just start time, and then the file path will yield the following string:
```bash
ffmpeg -i "/path/to/file" -ss hh:mm:ss
```

To get just the end time the <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>e</kbd> key combination must be pressed with **Pure Mode** activated.

The default mode, and the selection to copy to can be changed creating configuration file under mpv/script-opts with the name **PureMPV.conf**, and inserting the following:
```bash
pure_mode=no
selection=clipboard
```
With the Pure Mode deactivated, the script will copy the resulting value of the key combination right away, without the "ffmpeg -i" prepended, for example triggering <kbd>ctrl</kbd> + <kbd>e</kbd> will copy just the current timestamp, the <kbd>ctrl</kbd> + <kbd>w</kbd> will copy just the file path, and <kbd>ctrl</kbd> + <kbd>c</kbd> will copy just the cropping coordinates.

Cropping coordinates and set start, end times, can be cancelled by pressing the same combination of keys a third time.

## Cropping
To crop, it is necessary to put the mouse pointer in the starting position of the crop, before pressing <kbd>ctrl</kbd> + <kbd>c</kbd>. After that, position the mouse to the desired location to generate the cropping coordinates. A box will be drawn with ffmpeg filters, it only works if hwdec is set to auto-copy, or disabled. Animation for the crop box is available if desired, it can be enabled inserting ```cropbox_animation=yes``` in the configuration file. The box will be removed after cancelling the crop.

[comment]:![vivyx](https://user-images.githubusercontent.com/31898900/185803902-33f26518-8eac-437e-b0e8-063bb6c9be28.gif)
![vivycropbox_animation](https://user-images.githubusercontent.com/31898900/185887111-207cfa6b-610f-4952-a07e-58adafe7a3f9.gif)

## Installation
The script currently only supports Linux. To install, change directory to your mpv config folder, and git clone this repository. An appropriate folder will be created:
```bash
 $ cd ~/.config/mpv/scripts
 $ git clone https://github.com/4ndrs/PureMPV.git
```
