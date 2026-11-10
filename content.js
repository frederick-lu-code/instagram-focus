const HOST_ID = "ig-focus-host";
const HIDDEN_ATTR = "data-ig-focus-hide";
const DM_FLAG = "ig-focus-dm";
const NAV_HIDE_LABELS = new Set([
  "home",
  "explore",
  "reels",
  "notifications",
  "activity feed",
  "new post",
  "create",
  "create post",
]);
const SEARCH_LABELS = new Set(["search", "suchen", "buscar"]);

let pauseUntil = 0;
let overlayHost = null;
let applyQueued = false;
let searchMode = false;

{
  const kind = igFocusClassifyPath(location.pathname);
  if (kind === "block") {
    document.documentElement.classList.add("ig-focus", "ig-focus-blocked");
  }
}

function isPaused() {
  return pauseUntil > Date.now();
}

function currentPath() {
  return location.pathname || "/";
}

function classifyNow() {
  return igFocusClassifyPath(currentPath());
}

function isLoginSurface() {
  return Boolean(
    document.querySelector(
      'form input[type="password"], input[name="password"], input[name="username"]'
    )
  );
}

function pathFromAnchor(anchor) {
  try {
    const url = new URL(anchor.href, location.origin);
    if (!url.hostname.endsWith("instagram.com")) return null;
    return url.pathname;
  } catch (_err) {
    return null;
  }
}

function rememberDmContext() {
  const path = igFocusNormalizePath(currentPath());
  if (path === "/direct" || path.startsWith("/direct/")) {
    sessionStorage.setItem(DM_FLAG, "1");
    return;
  }
  if (!igFocusIsMediaPath(currentPath())) {
    sessionStorage.removeItem(DM_FLAG);
  }
}

function allowDmSharedMedia() {
  if (!igFocusIsMediaPath(currentPath())) return false;
  if (sessionStorage.getItem(DM_FLAG) === "1") return true;
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    return Boolean(referrer && referrer.hostname.endsWith("instagram.com") && referrer.pathname.startsWith("/direct"));
  } catch (_err) {
    return false;
  }
}

function pageAction() {
  if (isPaused() || isLoginSurface()) return "allow";
  if (allowDmSharedMedia()) return "allow";
  const kind = classifyNow();
  if (kind === "block") return "block";
  return kind;
}

function setHidden(el, hidden) {
  if (!el || el.id === HOST_ID) return;
  if (hidden) el.setAttribute(HIDDEN_ATTR, "");
  else el.removeAttribute(HIDDEN_ATTR);
}

function clearHidden() {
  document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((el) => el.removeAttribute(HIDDEN_ATTR));
}

function clickableAncestor(el) {
  let node = el;
  for (let i = 0; i < 7 && node && node !== document.body; i += 1) {
    if (node.matches?.("a, button, [role='link'], [role='button']")) return node;
    node = node.parentElement;
  }
  return el;
}

function hideNavItems() {
  document.querySelectorAll("a[href]").forEach((anchor) => {
    const path = pathFromAnchor(anchor);
    if (!path) return;
    const normalized = igFocusNormalizePath(path);
    if (
      normalized === "/" ||
      normalized === "/explore" ||
      normalized === "/reels" ||
      normalized === "/accounts/activity"
    ) {
      const item = clickableAncestor(anchor);
      if (item.closest("main")) return;
      setHidden(item, true);
    }
  });

  document.querySelectorAll("[aria-label]").forEach((el) => {
    const label = (el.getAttribute("aria-label") || "").trim().toLowerCase();
    if (!NAV_HIDE_LABELS.has(label)) return;
    const item = clickableAncestor(el);
    if (item.closest("main") || item.closest(`#${HOST_ID}`)) return;
    setHidden(item, true);
  });
}

function getNavUsername() {
  const roots = document.querySelectorAll('nav, [role="navigation"]');
  for (const root of roots) {
    for (const anchor of root.querySelectorAll("a[href]")) {
      const path = pathFromAnchor(anchor);
      const username = path ? igFocusProfileUsername(path) : null;
      if (username && anchor.querySelector("img")) return username;
    }
  }
  return null;
}

function profileMode() {
  if (classifyNow() !== "profile") return "none";
  const main = document.querySelector("main");
  if (!main) return "unknown";
  if (main.querySelector('a[href="/accounts/edit/"], a[href="/accounts/edit"], a[href*="/accounts/edit"]')) {
    return "own";
  }
  const pageUser = igFocusProfileUsername(currentPath());
  const navUser = getNavUsername();
  if (pageUser && navUser && pageUser.toLowerCase() === navUser.toLowerCase()) return "own";
  if (main.querySelector('a[href^="/direct/t/"], a[href^="/direct/new"]')) return "other";
  const labels = [...main.querySelectorAll("button, a, div[role='button']")].map((el) =>
    (el.textContent || "").trim().toLowerCase()
  );
  if (labels.some((text) => text === "follow" || text === "following" || text === "message" || text === "requested")) {
    return "other";
  }
  return "unknown";
}

function stripOtherProfile() {
  const main = document.querySelector("main");
  const header = main?.querySelector("header");
  if (!main || !header) return;
  const parent = header.parentElement;
  if (!parent) return;
  for (const child of parent.children) {
    if (child === header || header.contains(child)) continue;
    if (header.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING) {
      setHidden(child, true);
    }
  }
  header.querySelectorAll('a[href*="/stories/"]').forEach((anchor) => {
    const wrap = clickableAncestor(anchor);
    wrap.style.pointerEvents = "none";
  });
}

function filterSearchResults() {
  document.querySelectorAll("a[href]").forEach((anchor) => {
    const path = pathFromAnchor(anchor);
    if (!path) return;
    const normalized = igFocusNormalizePath(path);
    if (
      normalized.startsWith("/explore/tags") ||
      normalized.startsWith("/explore/locations") ||
      normalized.startsWith("/reels/audio") ||
      normalized.startsWith("/audio")
    ) {
      setHidden(clickableAncestor(anchor), true);
    }
  });
}

function overlayStyles() {
  return `
    :host { all: initial; }
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0b0b0b;
      color: #f4f4f4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .card {
      text-align: center;
      max-width: 22rem;
      padding: 24px;
    }
    .ring {
      width: 48px;
      height: 48px;
      margin: 0 auto 20px;
      border: 3px solid #f4f4f4;
      border-radius: 50%;
      border-right-color: transparent;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 650;
    }
    p {
      margin: 0 0 24px;
      color: #b3b3b3;
      font-size: 16px;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    button {
      appearance: none;
      min-width: 116px;
      border: 1px solid #3a3a3a;
      background: transparent;
      color: #f4f4f4;
      border-radius: 10px;
      padding: 10px 16px;
      font: inherit;
      cursor: pointer;
    }
    button:hover { background: #1a1a1a; }
  `;
}

function ensureOverlay() {
  if (overlayHost?.isConnected) return overlayHost;
  overlayHost = document.getElementById(HOST_ID);
  if (overlayHost) return overlayHost;
  if (!document.documentElement) return null;
  overlayHost = document.createElement("div");
  overlayHost.id = HOST_ID;
  const shadow = overlayHost.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>${overlayStyles()}</style>
    <div class="scrim" hidden>
      <div class="card">
        <div class="ring"></div>
        <h1>Focus is on</h1>
        <p>DMs and search only.</p>
        <div class="actions">
          <button type="button" data-action="dms">Messages</button>
          <button type="button" data-action="search">Search</button>
        </div>
      </div>
    </div>
  `;
  shadow.querySelector('[data-action="dms"]').addEventListener("click", () => {
    location.assign(`${location.origin}/direct/inbox/`);
  });
  shadow.querySelector('[data-action="search"]').addEventListener("click", openSearch);
  const parent = document.body || document.documentElement;
  parent.appendChild(overlayHost);
  return overlayHost;
}

function setOverlayVisible(visible) {
  const host = ensureOverlay();
  const scrim = host?.shadowRoot?.querySelector(".scrim");
  if (!scrim) return;
  scrim.hidden = !visible;
}

function findSearchControl() {
  const labeled = [...document.querySelectorAll("[aria-label]")].find((el) =>
    SEARCH_LABELS.has((el.getAttribute("aria-label") || "").trim().toLowerCase())
  );
  if (labeled) return clickableAncestor(labeled);
  return null;
}

function searchPanelOpen() {
  return Boolean(
    document.querySelector(
      'input[placeholder="Search" i], input[aria-label="Search input" i], input[aria-label="Search" i], input[type="search"]'
    )
  );
}

function openSearch() {
  searchMode = true;
  setOverlayVisible(false);
  document.documentElement.classList.add("ig-focus-search-mode");
  document.documentElement.classList.remove("ig-focus-blocked");
  const control = findSearchControl();
  control?.click();
}

function syncSearchMode(action) {
  if (action !== "block") {
    searchMode = false;
    return;
  }
  if (searchMode && searchPanelOpen()) return;
  if (searchMode && !searchPanelOpen()) searchMode = false;
}

function applyRootClasses(action) {
  const root = document.documentElement;
  root.classList.add("ig-focus");
  root.classList.toggle("ig-focus-blocked", action === "block" && !searchMode);
  root.classList.toggle("ig-focus-search-mode", Boolean(searchMode) && action === "block");
  root.classList.toggle("ig-focus-other-profile", action === "profile" && profileMode() === "other");
}

function apply() {
  rememberDmContext();
  const action = pageAction();
  syncSearchMode(action);

  if (isPaused()) {
    searchMode = false;
    document.documentElement.classList.remove(
      "ig-focus-blocked",
      "ig-focus-search-mode",
      "ig-focus-other-profile"
    );
    setOverlayVisible(false);
    clearHidden();
    return;
  }

  applyRootClasses(action);
  hideNavItems();
  filterSearchResults();

  if (action === "block" && !searchMode) {
    ensureOverlay();
    if (overlayHost && overlayHost.parentElement !== (document.body || document.documentElement)) {
      (document.body || document.documentElement).appendChild(overlayHost);
    }
    setOverlayVisible(true);
    return;
  }

  setOverlayVisible(false);

  if (action === "profile" && profileMode() === "other") {
    stripOtherProfile();
  }
}

function queueApply() {
  if (applyQueued) return;
  applyQueued = true;
  requestAnimationFrame(() => {
    applyQueued = false;
    apply();
  });
}

function patchHistory() {
  const wrap = (method) =>
    function patchedHistory() {
      const result = method.apply(this, arguments);
      queueApply();
      return result;
    };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener("popstate", queueApply);
}

function interceptBlockedClicks(event) {
  if (isPaused()) return;
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor) return;
  const path = pathFromAnchor(anchor);
  if (!path) return;
  if (!igFocusNormalizePath(path).startsWith("/stories")) return;
  if (currentPath().startsWith("/direct") || allowDmSharedMedia()) return;
  event.preventDefault();
  event.stopPropagation();
}

function boot() {
  patchHistory();
  document.addEventListener("click", interceptBlockedClicks, true);
  chrome.storage.local.get({ pauseUntil: 0 }, (result) => {
    pauseUntil = result.pauseUntil || 0;
    queueApply();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.pauseUntil) return;
    pauseUntil = changes.pauseUntil.newValue || 0;
    queueApply();
  });

  const observer = new MutationObserver(queueApply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(queueApply, 500);
  window.addEventListener("load", queueApply);
  if (document.body) queueApply();
  else document.addEventListener("DOMContentLoaded", queueApply);
}

boot();
