# PomPom

[![npm version](https://img.shields.io/npm/v/pompom.svg)](https://www.npmjs.com/package/pompom)
[![GitHub stars](https://img.shields.io/github/stars/fynjirby/pompom.svg?style=social&label=Star)](https://github.com/fynjirby/pompom)

A beautiful terminal-based Pomodoro timer to boost your productivity with focus sessions and breaks.

### Feel free to fork & contribute!

<p align="center">
  <img src="https://github.com/fynjirby/pompom/blob/main/img/pompom.png" alt="PomPom Screenshot" width="750px">
</p>

## Features

- ⏱️ Three timer modes: Focus (25m), Short Break (5m), and Long Break (15m)
- 🔄 Auto-switch between modes after completion
- 🔊 Sound alerts when timers complete
- ⚙️ Fully customizable durations
- 📊 Track completed focus sessions
- 💾 Automatic persistence of settings between sessions
- 🎨 Beautiful, color-coded interface

## Installation

```bash
npm i -g pompom
```

## Usage

Simply run in your terminal:
```bash
pompom
```

## How It Works

PomPom follows the Pomodoro Technique:

1. Work for 25 minutes (Focus mode)
2. Take a 5-minute break (Short Break)
3. Repeat steps 1-2 three more times
4. After 4 focus sessions, take a longer 15-minute break (Long Break)
5. Repeat the cycle

## Customization

PomPom stores your settings in `~/.pompom/settings.json`. You can also replace the default sound file with your own by placing a `sound.wav` file in `~/.pompom`.

## Thanks

- Real thanks to [djcows](https://x.com/djcows), his Spotify account - [djcow's Spotify](https://open.spotify.com/artist/0t1G3n5glVRf3NuRVkNPbb?si=5cHwvOCrRJmxBo74Nz8ZLg)
