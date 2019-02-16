# Magic Table

detail description: http://wiki.fablab-karlsruhe.de/doku.php?id=projekte:2018:magictable&s[]=magic&s[]=table

## Requirements

- ffmpeg (including support for vpx and h264)
- libx264
- libvpx

## Usage

### OpenCV parser

To start the Part that interprets the camera image and renders the output image run:

```bash
python main.py
```

inside the `src` folder

### Content Engine

To start the content engine run:

```bash
yarn start
```

inside the `src/content-engine` folder

## Robot Hardware

Electronics:

- Wemos D1 Mini
- Wemos Motor Shield
- Wemos Battery Shield
- LiPo Battery
- 2 x 300rpm geared 3V DC motor (D-shaft)
- 2 x rubber O-ring
- Ball Coaster
- 2 LEDs
- Lasercut & 3D Printed Parts (see part files in robot/hardware/mkI)

## upload SPIFFS via ota

    pio run --target uploadfs
