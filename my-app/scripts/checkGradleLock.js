const fs = require("fs");
const path = require("path");
const os = require("os");

const projectRoot = path.resolve(__dirname, "..");
const lockFile = path.join(
  projectRoot,
  "android",
  ".gradle",
  "8.14.3",
  "fileHashes",
  "fileHashes.lock"
);
const easIgnorePath = path.join(projectRoot, ".easignore");
const tempCopyPath = path.join(os.tmpdir(), `fileHashes.lock.${Date.now()}`);

const sendLog = (payload) => {
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/2625f657-4b15-4243-8df8-b6f7cadf8a91", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
};

const runId = `run-${Date.now()}`;
const now = () => Date.now();

// #region agent log
sendLog({
  sessionId: "debug-session",
  runId,
  hypothesisId: "H1",
  location: "scripts/checkGradleLock.js:23",
  message: "check start",
  data: { projectRoot, lockFile },
  timestamp: now(),
});
// #endregion

const easIgnoreExists = fs.existsSync(easIgnorePath);
// #region agent log
sendLog({
  sessionId: "debug-session",
  runId,
  hypothesisId: "H3",
  location: "scripts/checkGradleLock.js:34",
  message: ".easignore present",
  data: { easIgnoreExists, easIgnorePath },
  timestamp: now(),
});
// #endregion

let easIgnoreContents = "";
if (easIgnoreExists) {
  easIgnoreContents = fs.readFileSync(easIgnorePath, "utf8");
}
// #region agent log
sendLog({
  sessionId: "debug-session",
  runId,
  hypothesisId: "H3",
  location: "scripts/checkGradleLock.js:46",
  message: ".easignore contents",
  data: { containsAndroidGradle: easIgnoreContents.includes("android/.gradle/") },
  timestamp: now(),
});
// #endregion

const lockExists = fs.existsSync(lockFile);
// #region agent log
sendLog({
  sessionId: "debug-session",
  runId,
  hypothesisId: "H1",
  location: "scripts/checkGradleLock.js:58",
  message: "lock file exists",
  data: { lockExists },
  timestamp: now(),
});
// #endregion

let copyError = null;
if (lockExists) {
  try {
    fs.copyFileSync(lockFile, tempCopyPath);
  } catch (error) {
    copyError = { name: error.name, message: error.message };
  }
}
// #region agent log
sendLog({
  sessionId: "debug-session",
  runId,
  hypothesisId: "H1",
  location: "scripts/checkGradleLock.js:75",
  message: "copy lock file",
  data: { tempCopyPath, copyError },
  timestamp: now(),
});
// #endregion

if (fs.existsSync(tempCopyPath)) {
  fs.unlinkSync(tempCopyPath);
}
// #region agent log
sendLog({
  sessionId: "debug-session",
  runId,
  hypothesisId: "H2",
  location: "scripts/checkGradleLock.js:88",
  message: "check finished",
  data: { tempCopyRemoved: !fs.existsSync(tempCopyPath) },
  timestamp: now(),
});
// #endregion
