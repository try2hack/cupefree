# CUPE Unblur 🔓

A [Tampermonkey](https://www.tampermonkey.net/) userscript that unblurs content on **cupe.live** — removes the blur effect and `BlurWaterMask` SVG overlays.

> For educational / personal use only.

## ✨ Features

- 🖼️ Strips the blur parameter (`bl-N`) from image URLs, e.g. `?tr=w-1200,bl-70` → `?tr=w-1200`
- 🎭 Removes/hides `BlurWaterMask` SVG overlays covering the images
- ⚡ No flicker: CSS injected at `document-start`, before the page renders
- 🚀 `MutationObserver` catches images added later (lazy load / tab switching) instantly — no CPU-hungry `setInterval` polling
- 📦 Handles `srcset`, `data-src`, `data-original`, `data-lazy`, and `<picture><source>`
- 🔧 Zero configuration — install and it just works

## 📥 Installation

### Option 1 — Install from file (recommended)

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension in your browser.
2. Open the script from this link and click **Install**:

   ```
   https://raw.githubusercontent.com/try2hack/cupefree/main/cupefree.js
   ```

3. Open (or refresh) cupe.live and log in — done! 🎉

### Option 2 — Manual / create new script

1. Click the Tampermonkey icon → **Create a new script**
2. Replace the sample code with the contents of `cupefree.js`
3. Press **File → Save** (or `Ctrl+S`)
4. Refresh cupe.live

## 🛠️ Usage

- Just browse the site as usual (e.g. the **Special Album / SPECIAL** tab, Daily Post, etc.)
- Blurred images become sharp automatically
- Verify in DevTools Console (F12): you'll see `[CUPE v9] Fixed (Images + Masks): N` logs

## 🔄 Updating

- Tampermonkey automatically checks for updates from GitHub (via `@updateURL` / `@downloadURL`)
- Or re-install from the `raw.githubusercontent.com` link above

## ⚙️ How it works

The site applies two layers of blur:

1. **CDN-side blur** — image URLs carry a `bl-N` parameter:
   ```
   https://.../feed/xxx.jpeg?tr=w-1200,bl-70
   ```
   The script removes `bl-70` → the server returns the original, sharp image.

2. **SVG overlay mask** — a `BlurWaterMask/...svg` element is placed on top of the image as an extra layer.
   The script removes/hides that element.

The script scans the whole page and observes DOM mutations, so content loaded later (lazy load, SPA tabs) is covered too.

## ❓ FAQ

**Q: Installed but nothing happens?**
- Hard-refresh the page (the script runs at `document-start`, before content loads)
- Make sure Tampermonkey is enabled (Dashboard → enabled)
- Check the Console (F12) for a `[CUPE v9]` log or any errors

**Q: Some sections are still blurred?**
- Some zones (e.g. Live Archive, Unlock Post) may be protected by encryption or require payment — the script only handles `bl-N` + `BlurWaterMask` blurring.

**Q: Does it drain CPU/battery?**
- No. It uses `MutationObserver` (reacts only when the DOM changes) instead of polling every 400 ms like older versions.

## 📁 File structure

```
cupefree.js   - the Tampermonkey userscript (all you need)
README.md     - this file
```

## ⚠️ Disclaimer

- Made for educational / personal use. Please respect the website's terms of service and the creators' rights.
- Use the site responsibly and only if you're of legal age.

## 📜 License

No license specified — use at your own responsibility.
