const IG_FOCUS_RESERVED_ROOTS = new Set([
  "about",
  "accounts",
  "activity",
  "ads",
  "api",
  "blog",
  "business",
  "challenge",
  "channel",
  "channels",
  "create",
  "developer",
  "direct",
  "directory",
  "emails",
  "error",
  "explore",
  "features",
  "feed",
  "graphql",
  "guide",
  "guides",
  "help",
  "home",
  "igtv",
  "instagram",
  "jobs",
  "legal",
  "lite",
  "live",
  "nametag",
  "notifications",
  "oauth",
  "p",
  "privacy",
  "push",
  "reel",
  "reels",
  "session",
  "shop",
  "shopping",
  "static",
  "stories",
  "support",
  "terms",
  "tv",
  "web",
  "your_activity",
]);

function igFocusNormalizePath(pathname) {
  if (!pathname) return "/";
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch (_err) {
    path = pathname;
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

function igFocusClassifyPath(pathname) {
  const path = igFocusNormalizePath(pathname);
  const parts = path.split("/").filter(Boolean);
  const head = (parts[0] || "").toLowerCase();
  const sub = (parts[1] || "").toLowerCase();

  if (path === "/") return "block";

  if (head === "accounts") {
    if (sub === "activity" || sub === "notifications") return "block";
    return "allow";
  }

  if (head === "direct") {
    if (sub === "channels" || sub === "channel" || sub === "c") return "block";
    return "allow";
  }

  if (
    head === "create" ||
    head === "challenge" ||
    head === "session" ||
    head === "oauth" ||
    head === "emails" ||
    head === "privacy" ||
    head === "legal" ||
    head === "about" ||
    head === "terms" ||
    head === "language" ||
    head === "support" ||
    head === "help"
  ) {
    return "allow";
  }

  if (
    head === "explore" ||
    head === "reels" ||
    head === "stories" ||
    head === "p" ||
    head === "reel" ||
    head === "tv" ||
    head === "igtv" ||
    head === "shop" ||
    head === "shopping" ||
    head === "live" ||
    head === "home" ||
    head === "feed" ||
    head === "notifications" ||
    head === "activity" ||
    head === "your_activity" ||
    head === "nametag" ||
    head === "channel" ||
    head === "channels" ||
    head === "guide" ||
    head === "guides"
  ) {
    return "block";
  }

  if (IG_FOCUS_RESERVED_ROOTS.has(head)) return "allow";

  if (
    sub === "followers" ||
    sub === "following" ||
    sub === "verified_followers" ||
    sub === "followers_mutual"
  ) {
    return "allow";
  }

  if (sub === "live" || sub === "shop" || sub === "channel" || sub === "broadcast") {
    return "block";
  }

  return "profile";
}

function igFocusProfileUsername(pathname) {
  const path = igFocusNormalizePath(pathname);
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return null;
  const head = parts[0].toLowerCase();
  if (IG_FOCUS_RESERVED_ROOTS.has(head)) return null;
  return parts[0];
}

function igFocusIsMediaPath(pathname) {
  const path = igFocusNormalizePath(pathname);
  const parts = path.split("/").filter(Boolean);
  const head = (parts[0] || "").toLowerCase();
  if (head === "p" || head === "reel" || head === "tv" || head === "igtv") return parts.length >= 2;
  if (head === "stories") return true;
  return false;
}
