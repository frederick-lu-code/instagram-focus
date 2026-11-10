# Instagram Focus

A Chrome and Edge extension that keeps Instagram web on **DMs and profile search only**.

## Download and install

This extension isn't on the Chrome Web Store, so you install it straight from
this repository. It takes about a minute.

### 1. Download the extension

**Option A — ZIP (no tools needed)**

1. Near the top of this page, click the green **Code** button.
2. Click **Download ZIP**.
3. Unzip the file. You'll get a folder named `instagram-focus-main`.
   Move it somewhere permanent (for example, your Documents folder) —
   Chrome loads the extension from this folder, so if you delete or move it
   later, the extension stops working.

**Option B — Git**

```sh
git clone https://github.com/frederick-lu-code/instagram-focus.git
```

### 2. Add it to Chrome

1. Open a new tab and go to `chrome://extensions`
   (in Microsoft Edge: `edge://extensions`).
2. Turn on **Developer mode** (top-right toggle in Chrome; left sidebar in Edge).
3. Click **Load unpacked**.
4. Select the folder you downloaded — the one that directly contains
   `manifest.json`. (If you used the ZIP and see another folder inside with
   the same name, pick the inner one.)
5. Refresh any open Instagram tabs.

**Instagram Focus** now appears in your extensions list. To keep its icon handy,
click the puzzle-piece **Extensions** button in the toolbar and pin it.

### Updating

Download the latest version the same way and replace your old folder's
contents (or run `git pull`), then click the reload ↻ icon on the
extension's card in `chrome://extensions`.

### Uninstalling

Click **Remove** on the extension's card in `chrome://extensions`, then
delete the folder.

> Chrome may show a "Disable developer mode extensions" notice at startup.
> That's normal for extensions installed this way — click the X to dismiss it.

## What it does

Blocked (replaced with a Focus screen):

- Home feed, Explore, Reels, Stories
- Post and reel permalinks
- Hashtags, locations, Shop, Live, broadcast channels
- Notifications

Allowed:

- Direct messages, including posts/reels/stories shared in a chat
- Notes in the inbox
- People search
- Profile identity (avatar, bio, follow, Message) — not their posts
- Your own profile in full
- Followers / following lists
- Create, if you open `/create` directly
- Login, settings, and account switching

Pause from the toolbar icon for 1, 5, or 15 minutes.
