const titleEl = document.getElementById("status-title");
const copyEl = document.getElementById("status-copy");
const countdownEl = document.getElementById("countdown");
const pauseActions = document.getElementById("pause-actions");
const resumeBtn = document.getElementById("resume");

let pauseUntil = 0;
let timer = null;

function remainingMs() {
  return Math.max(0, pauseUntil - Date.now());
}

function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds} remaining`;
}

function render() {
  const remaining = remainingMs();
  const paused = remaining > 0;
  titleEl.textContent = paused ? "Paused" : "Focus is on";
  copyEl.textContent = paused
    ? "Feed, reels, and stories are visible until the timer ends."
    : "DMs and search only.";
  countdownEl.hidden = !paused;
  countdownEl.textContent = paused ? formatRemaining(remaining) : "";
  pauseActions.hidden = paused;
  resumeBtn.hidden = !paused;
}

function loadState() {
  chrome.runtime.sendMessage({ type: "IG_FOCUS_STATE" }, (response) => {
    pauseUntil = response?.pauseUntil || 0;
    render();
  });
}

document.querySelectorAll("[data-minutes]").forEach((button) => {
  button.addEventListener("click", () => {
    const minutes = Number(button.dataset.minutes);
    chrome.runtime.sendMessage({ type: "IG_FOCUS_PAUSE", minutes }, (response) => {
      pauseUntil = response?.pauseUntil || 0;
      render();
    });
  });
});

resumeBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "IG_FOCUS_RESUME" }, (response) => {
    pauseUntil = response?.pauseUntil || 0;
    render();
  });
});

loadState();
timer = setInterval(render, 250);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.pauseUntil) return;
  pauseUntil = changes.pauseUntil.newValue || 0;
  render();
});
