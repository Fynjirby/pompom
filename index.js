#!/usr/bin/env node

// import dependencies
const blessed = require("blessed");
const fs = require("fs");
const path = require("path");
const os = require("os");
const figlet = require("figlet");
const player = require("play-sound")({});

// set some defaults
const configDir = path.join(os.homedir(), ".pompom");
const settingsFile = path.join(configDir, "settings.json");

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const defaultSettings = {
  durations: {
    FOCUS: 25,
    SHORT_BREAK: 5,
    LONG_BREAK: 15,
  },
  autoSwitch: true,
  completedFocus: 0,
  lastUsed: new Date().toISOString(),
};

// load settings function
function loadSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      const data = fs.readFileSync(settingsFile, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return defaultSettings;
}

// save settings function
function saveSettings(settings) {
  try {
    settings.lastUsed = new Date().toISOString();
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

const settings = loadSettings();

// set screen
const screen = blessed.screen({
  smartCSR: true,
  title: "PomPom - Pomodoro Timer",
  warnings: false,
  terminal: "xterm-256color",
});

// set modes defaults
const MODES = {
  FOCUS: { name: "FOCUS", color: "green", nextMode: "SHORT_BREAK" },
  SHORT_BREAK: { name: "SHORT BREAK", color: "blue", nextMode: "FOCUS" },
  LONG_BREAK: { name: "LONG BREAK", color: "magenta", nextMode: "FOCUS" },
};

// set values
let isRunning = false;
let timerId = null;
let currentMode = MODES.FOCUS;
let currentDurations = settings.durations;
let currentTime = currentDurations.FOCUS * 60;
let completedFocus = settings.completedFocus || 0;
let autoSwitch = settings.autoSwitch !== undefined ? settings.autoSwitch : true;

// main container creation
const mainContainer = blessed.box({
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
});
screen.append(mainContainer);

// show menubar
const menuBar = blessed.box({
  parent: mainContainer,
  top: 0,
  left: 0,
  width: "100%",
  height: 1,
  style: {
    bg: "#CC6766",
    fg: "white",
  },
  content: ` 1 - FOCUS - ${currentDurations.FOCUS}m    2 - SHORT BREAK - ${currentDurations.SHORT_BREAK}m    3 - LONG BREAK - ${currentDurations.LONG_BREAK}m`,
  align: "center",
  valign: "middle",
});

// show help window (hidden)
const helpModal = blessed.box({
  parent: screen,
  top: "center",
  left: "center",
  width: "80%",
  height: "75%",
  tags: true,
  border: {
    type: "line",
  },
  style: {
    fg: "white",
    border: {
      fg: "#f0f0f0",
    },
  },
  content: "",
  align: "left",
  hidden: true,
});

// show main window - timer
const timerDisplay = blessed.box({
  parent: mainContainer,
  top: "center",
  left: "center",
  width: "80%",
  height: "70%",
  content: formatTime(currentTime),
  tags: true,
  style: {
    fg: currentMode.color,
    bg: "black",
  },
  align: "center",
  valign: "middle",
});

// show status bar
const statusBar = blessed.box({
  parent: mainContainer,
  bottom: 0,
  left: 0,
  width: "90%",
  height: 1,
  content: ` PomPom - ${currentMode.name} - Ready`,
  style: {
    fg: "white",
  },
});

// show help bar
const helpBar = blessed.box({
  parent: mainContainer,
  bottom: 0,
  right: 1,
  width: "10%",
  height: 1,
  content: `Help - ?`,
  style: {
    fg: "white",
  },
});

// set help content
function updateHelpContent() {
  helpModal.setContent(
    `{center}{bold}PomPom - Keyboard Shortcuts{/bold}{/center}\n\n` +
      ` {bold}[Space]{/bold} : Start/Pause timer\n` +
      ` {bold}[r]{/bold}     : Reset current timer\n` +
      ` {bold}[d]{/bold}     : Reset to default duration\n` +
      ` {bold}[1]{/bold}     : Switch to FOCUS mode - ${currentDurations.FOCUS}m\n` +
      ` {bold}[2]{/bold}     : Switch to SHORT BREAK mode - ${currentDurations.SHORT_BREAK}m\n` +
      ` {bold}[3]{/bold}     : Switch to LONG BREAK mode - ${currentDurations.LONG_BREAK}m\n` +
      ` {bold}[+/-]{/bold}   : Increase/decrease current duration\n` +
      ` {bold}[a]{/bold}     : Toggle auto-switch (currently ${
        autoSwitch ? "ON" : "OFF"
      })\n` +
      ` {bold}[c]{/bold}     : Clear statistics\n` +
      ` {bold}[?]{/bold}     : Show this help\n` +
      ` {bold}[q]{/bold}     : Quit PomPom\n\n` +
      `{center}Press any key to close this help{/center}`
  );
}

// show and hide help functions
function showHelp() {
  updateHelpContent();
  helpModal.hidden = false;
  screen.render();
}

function hideHelp() {
  helpModal.hidden = true;
  screen.render();
}

// format time function
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const text = `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`.replaceAll("", " ");

  return figlet.textSync(text, {
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 80,
    whitespaceBreak: true,
  });
}

// reset to default duration function
function resetToDefaultDuration() {
  let defaultDuration;

  if (currentMode === MODES.FOCUS) {
    defaultDuration = 25;
  } else if (currentMode === MODES.SHORT_BREAK) {
    defaultDuration = 5;
  } else if (currentMode === MODES.LONG_BREAK) {
    defaultDuration = 15;
  } else {
    defaultDuration = 25;
  }

  const modeKey = Object.keys(MODES).find((key) => MODES[key] === currentMode);

  if (modeKey) {
    currentDurations[modeKey] = defaultDuration;
  }

  currentTime = defaultDuration * 60;

  updateMenuBar();
  timerDisplay.setContent(
    `{bold}${formatTime(currentTime)}{/bold}\n\n${
      currentMode.name
    }\n\n${completedFocus} focus sessions completed`
  );
  setStatus(
    `${currentMode.name} reset to default duration (${defaultDuration} minutes)`
  );

  updateSettings();
}

// update menu bar function
function updateMenuBar() {
  menuBar.setContent(
    ` 1 - FOCUS - ${currentDurations.FOCUS}m    2 - SHORT BREAK - ${currentDurations.SHORT_BREAK}m    3 - LONG BREAK - ${currentDurations.LONG_BREAK}m`
  );
  screen.render();
}

// update settings function
function updateSettings() {
  settings.durations = currentDurations;
  settings.autoSwitch = autoSwitch;
  settings.completedFocus = completedFocus;
  saveSettings(settings);
}

// switch mode function
function switchMode(mode, resetTimer = true) {
  clearInterval(timerId);
  isRunning = false;

  currentMode = MODES[mode];
  if (resetTimer) {
    currentTime = currentDurations[mode] * 60;
  }

  timerDisplay.style.fg = currentMode.color;
  timerDisplay.setContent(
    `{bold}${formatTime(currentTime)}{/bold}\n\n${
      currentMode.name
    }\n\n`
  );

  setStatus(`${currentMode.name} - Ready`);
  screen.render();

  updateSettings();
}

// change duration function
function changeDuration(change) {
  const modeKey = Object.keys(MODES).find((key) => MODES[key] === currentMode);
  let newDuration = currentDurations[modeKey] + change;

  if (newDuration < 1) newDuration = 1;

  currentDurations[modeKey] = newDuration;
  currentTime = newDuration * 60;

  updateMenuBar();
  timerDisplay.setContent(
    `{bold}${formatTime(currentTime)}{/bold}\n\n${
      currentMode.name
    }\n\n`
  );
  setStatus(`${currentMode.name} duration changed to ${newDuration} minutes`);

  updateSettings();
}

// start timer function
function startTimer() {
  if (isRunning) return;

  isRunning = true;
  setStatus(`${currentMode.name} - Running`);

  timerId = setInterval(() => {
    currentTime--;

    if (currentTime <= 0) {
      playSound();
      clearInterval(timerId);
      isRunning = false;

      if (currentMode === MODES.FOCUS) {
        completedFocus++;

        updateSettings();
      }

      setStatus(
        `${currentMode.name} completed! Focus sessions: ${completedFocus}`
      );

      if (autoSwitch) {
        const nextModeKey = currentMode.nextMode;

        if (currentMode === MODES.FOCUS && completedFocus % 4 === 0) {
          switchMode("LONG_BREAK");
        } else {
          switchMode(nextModeKey);
        }

        setTimeout(() => {
          startTimer();
        }, 1000);
      }
    }

    timerDisplay.setContent(
      `{bold}${formatTime(currentTime)}{/bold}\n\n${
        currentMode.name
      }\n\n`
    );
    screen.render();
  }, 1000);
}

// pause timer function
function pauseTimer() {
  if (!isRunning) return;

  clearInterval(timerId);
  isRunning = false;
  setStatus(`${currentMode.name} - Paused`);
}

// reset timer function
function resetTimer() {
  const modeKey = Object.keys(MODES).find((key) => MODES[key] === currentMode);
  clearInterval(timerId);
  isRunning = false;
  currentTime = currentDurations[modeKey] * 60;
  setStatus(`${currentMode.name} - Reset`);
  timerDisplay.setContent(
    `{bold}${formatTime(currentTime)}{/bold}\n\n${
      currentMode.name
    }\n\n`
  );
  screen.render();
}

// play djcows track function
function playSound() {
  try {
    const localSoundPath = path.join(__dirname, "sound.wav");
    const userSoundPath = path.join(os.homedir(), ".pompom", "sound.wav");

    if (fs.existsSync(userSoundPath)) {
      player.play(userSoundPath, (err) => {
        if (err) {
          console.error("Error playing user sound:", err);
          process.stdout.write("\x07");
        }
      });
    } else if (fs.existsSync(localSoundPath)) {
      player.play(localSoundPath, (err) => {
        if (err) {
          console.error("Error playing local sound:", err);
          process.stdout.write("\x07");
        }
      });
    } else {
      process.stdout.write("\x07");
    }
  } catch (e) {
    console.error("Could not play sound:", e);
    process.stdout.write("\x07");
  }
}

// set status function lol
function setStatus(message) {
  statusBar.setContent(` PomPom - ${message}`);
  screen.render();
}

// toggle auto switch function
function toggleAutoSwitch() {
  autoSwitch = !autoSwitch;
  updateMenuBar();
  setStatus(`Auto-switch ${autoSwitch ? "enabled" : "disabled"}`);

  updateSettings();
}

// clear stats function
function clearStats() {
  completedFocus = 0;
  timerDisplay.setContent(
    `{bold}${formatTime(currentTime)}{/bold}\n\n${
      currentMode.name
    }\n\n`
  );
  setStatus("Statistics cleared");

  updateSettings();
}

// keybinds setting
screen.key(["q", "й"], (settings) => {
  settings.lastUsed = new Date().toISOString();
  updateSettings();
  return process.exit(0);
});

screen.key(["space"], () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

screen.key(["r", "к"], () => {
  resetTimer();
});

screen.key(["d", "в"], () => {
  resetToDefaultDuration();
});

screen.key(["1"], () => {
  switchMode("FOCUS");
});

screen.key(["2"], () => {
  switchMode("SHORT_BREAK");
});

screen.key(["3"], () => {
  switchMode("LONG_BREAK");
});

screen.key(["+", "="], () => {
  changeDuration(1);
});

screen.key(["-", "_"], () => {
  changeDuration(-1);
});

screen.key(["a", "ф"], () => {
  toggleAutoSwitch();
});

screen.key(["c", "с"], () => {
  clearStats();
});

screen.key(["?", "/"], () => {
  if (helpModal.hidden) {
    showHelp();
  } else {
    hideHelp();
  }
});

screen.on("keypress", (ch, key) => {
  if (!helpModal.hidden) {
    hideHelp();
    return;
  }
});

// show session count
timerDisplay.setContent(
  `{bold}${formatTime(currentTime)}{/bold}\n\n${
    currentMode.name
  }\n\n${completedFocus} focus sessions completed`
);

// thats all folks!
screen.render();