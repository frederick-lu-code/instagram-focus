const PAUSE_ALARM = "ig-focus-pause-end";

async function getPauseUntil() {
  const { pauseUntil = 0 } = await chrome.storage.local.get({ pauseUntil: 0 });
  return pauseUntil;
}

async function setPauseUntil(pauseUntil) {
  await chrome.storage.local.set({ pauseUntil });
  await chrome.alarms.clear(PAUSE_ALARM);
  if (pauseUntil > Date.now()) {
    await chrome.alarms.create(PAUSE_ALARM, { when: pauseUntil });
  }
  await updateBadge();
}

async function updateBadge() {
  const pauseUntil = await getPauseUntil();
  const remainingMs = pauseUntil - Date.now();
  if (remainingMs <= 0) {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  const minutes = Math.max(1, Math.ceil(remainingMs / 60000));
  await chrome.action.setBadgeBackgroundColor({ color: "#333333" });
  try {
    await chrome.action.setBadgeTextColor({ color: "#ffffff" });
  } catch (_err) {
    // Edge older than badge text color support.
  }
  await chrome.action.setBadgeText({ text: `${minutes}m` });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ pauseUntil: 0 }, ({ pauseUntil }) => {
    if (!pauseUntil) chrome.storage.local.set({ pauseUntil: 0 });
    updateBadge();
  });
  chrome.alarms.create("ig-focus-badge", { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
  chrome.alarms.create("ig-focus-badge", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === PAUSE_ALARM) {
    await chrome.storage.local.set({ pauseUntil: 0 });
  }
  await updateBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.pauseUntil) updateBadge();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "IG_FOCUS_PAUSE") {
    const minutes = Number(message.minutes);
    const pauseUntil = Date.now() + minutes * 60 * 1000;
    setPauseUntil(pauseUntil).then(() => sendResponse({ pauseUntil }));
    return true;
  }
  if (message?.type === "IG_FOCUS_RESUME") {
    setPauseUntil(0).then(() => sendResponse({ pauseUntil: 0 }));
    return true;
  }
  if (message?.type === "IG_FOCUS_STATE") {
    getPauseUntil().then((pauseUntil) => sendResponse({ pauseUntil }));
    return true;
  }
  return false;
});

updateBadge();
