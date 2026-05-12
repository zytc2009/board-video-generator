# Board Video Generator

Local CLI for rendering simple board lesson scripts into whiteboard-style MP4 videos.

## Requirements

- Node.js 22 or newer
- FFmpeg on `PATH`

The current package may run on Node 20 for tests, but the documented target remains Node.js 22+.

## Install

```sh
npm install
```

## Render Demo

```sh
npm run render -- examples/demo.board.md
```

Output:

```text
dist/demo.mp4
```

## Script Format

Board scripts are Markdown files with directive blocks:

```md
::write duration=1.2 x=120 y=120
Newton's Second Law
::

::formula duration=1.0 x=160 y=260
F = ma
::

::arrow duration=0.8 from=260,300 to=500,300
::

::box duration=0.8 x=140 y=230 width=460 height=130
::
```

Supported directives:

- `write`
- `formula`
- `arrow`
- `box`
- `clear` reserved for later

## Troubleshooting

Check FFmpeg:

```sh
ffmpeg -version
```

For Puppeteer or Chromium issues, reinstall dependencies:

```sh
npm install
```
