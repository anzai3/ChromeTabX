# ChromeTabX

**A clearer home for your Chrome tabs.**

**English** · [简体中文](README.zh-CN.md)

ChromeTabX replaces Chrome's new-tab page with a lightweight workspace for finding, organizing, and closing tabs. Search across open pages, browse automatic title-based categories, and remove duplicate URLs—all locally, without an account or cloud service.

Also displayed in the extension as **Tab Matrix**. Built with vanilla JavaScript and Manifest V3. No dependencies or build step are required to load the extension.

## Features

- **Start with your current window.** New tabs show pages from their own window by default. Use the window selector to browse other windows or all windows.
- **Search beyond titles.** Match titles, URLs, and readable text in loaded pages. Content matches include a short excerpt. Press `/` to focus search.
- **Automatic category cloud.** Shared title keywords become categories. Larger groups can show up to three secondary categories, with consistent colors for browsing.
- **Keep one copy of a URL.** Preview duplicate tabs before confirming cleanup across windows.
- **Simple tab controls.** Open, close, pin, or unpin tabs, and switch between cards and a list.
- **English and Simplified Chinese.** Follow Chrome's UI language by default, or switch instantly without losing search and filters.
- **Optional Chrome metrics on macOS.** A local helper displays total Chrome memory and CPU usage.

## Install

Requires **Chrome 121 or later**. The extension is installed from source; the optional resource monitor requires macOS and Python 3.

1. [Download the source ZIP](https://github.com/anzai3/ChromeTabX/archive/refs/heads/main.zip) and extract it, or clone the repository:
   ```sh
   git clone https://github.com/anzai3/ChromeTabX.git
   ```
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Select **Load unpacked** and choose the folder containing `manifest.json`.
4. Open a new tab. If Chrome asks whether to keep the new-tab replacement, confirm it.

After updating the source, click **Reload** on the extension card and open a new tab. If you cloned the repository, use `git pull --ff-only` to download updates.

## Everyday use

Type in the search box to find a page, select a category to narrow the results, and click a page title to switch to that tab and its window. The window selector starts with the current window; choose **All windows** when needed.

Use **Remove duplicates** to review matching URLs before closing extras. Cleanup covers all windows, even when the visible results are filtered. Save unfinished forms before confirming a close.

The language selector offers **System**, **简体中文**, and **English**. Unsupported languages fall back to English. Your selection stays on this device. Page titles, excerpts, and extracted category keywords remain in their original language.

## How it works

### Duplicate cleanup

Only identical, complete HTTP/HTTPS URLs are grouped. Protocols, query strings, and fragments remain significant. Different URLs are never merged merely because their titles or content look similar. Private and normal browsing contexts are kept separate.

For each group, the extension prefers a pinned tab, then an active tab, then the most recently accessed tab. Candidates are checked again when cleanup is confirmed. There is no automatic background closing.

### Page-content search

Search starts after a 300 ms pause and reads at most four pages concurrently. It matches continuous text, with case-insensitive English matching. Use **Search content again** after a page changes.

Search reads loaded, visible text in the main frame. Protected browser pages, restricted sites, and discarded tabs may be unavailable; their titles and URLs can still match. The extension does not wake discarded tabs. Iframes, PDF viewers, image text, unloaded content, and closed Shadow DOM are outside the search scope.

### Title-based categories

Local word segmentation extracts shared keywords and filters common filler words, numeric fragments, and known site suffixes. At least two tabs must share a keyword to form a primary category; remaining tabs appear under Other. Each tab has one primary category.

Groups with at least six tabs can expose up to three secondary categories based on additional shared keywords. Secondary categories can overlap, so their counts should not be added together. Categories are computed from all managed tabs, while the window filter limits displayed results. This is keyword grouping, not AI semantic classification.

### Last-access information

Last-access labels use Chrome's `lastAccessed` timestamp, not publication dates or visit frequency. Unknown timestamps are not estimated. The code retains inactivity-filtering logic, but the simplified interface currently has no dedicated inactive-tabs navigation entry.

## Optional macOS memory and CPU monitor

Tab management works without the helper. To enable metrics:

1. Copy the extension ID from `chrome://extensions`.
2. Run from the repository folder, replacing `YOUR_EXTENSION_ID`:
   ```sh
   python3 native/install.py YOUR_EXTENSION_ID
   ```
3. Reload the extension and open a new tab.

The helper uses Native Messaging and permits only the extension ID supplied during installation. It reads local Chrome process statistics; it does not accept arbitrary commands or upload measurements.

- **Memory:** total resident memory (RSS) across Google Chrome processes. Shared pages may be counted more than once.
- **CPU:** approximately one second of sampled process CPU time. 100% represents one fully occupied core; multiple cores can exceed 100%.
- **Scope:** all local Google Chrome windows, profiles, and helper processes—not just the selected window.
- **Refresh:** every 10 seconds and after tab closures. Other activity and retained caches mean closing a tab does not guarantee either number will fall.

A disconnected monitor shows dashes. Check that the helper was installed with the current extension ID, then reload the extension. Other platforms do not currently have a metrics helper.

To uninstall the helper, remove its files from `~/Library/Application Support/TabMatrixMetrics` and its registration file at `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.tabmatrix.metrics.json`.

## Privacy and permissions

No account, analytics, remote scripts, external fonts, or cloud processing are used. Search excerpts stay in the new-tab page's memory; they are not persisted or uploaded. Language preferences are stored locally.

| Permission | Purpose |
| --- | --- |
| `tabs` | Read tab titles and URLs; manage tabs across windows. |
| `scripting` | Search readable page text on demand. |
| HTTP/HTTPS host access | Allow content searches on permitted websites. |
| `nativeMessaging` | Connect to the optional local metrics helper. |

Incognito access is not enabled by default. The extension's own new-tab pages are excluded from the managed tab list.

## Development

Use a recent Node.js version with its built-in test runner:

```sh
npm test
```

For a browser preview with sample data:

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765/newtab.html`. Preview mode cannot manage real tabs or display live Chrome metrics; load the extension for those features.

| File or directory | Responsibility |
| --- | --- |
| `app.js`, `newtab.html`, `style.css` | Tab manager UI and interaction. |
| `core.js`, `title-rules.js` | Duplicate detection, access labels, title categories. |
| `content-search.js` | On-demand page-content search. |
| `background.js` | Extension action handling. |
| `metrics.js`, `native/` | Resource display and optional macOS helper. |
| `packages/app-i18n/` | Reusable language runtime and DOM adapter. |
| `tests/` | Behavior and regression tests. |

The [i18n package guide](packages/app-i18n/README.md) covers its API and integration. It is a local, versioned package, not a published npm dependency. The extension currently keeps a separate compatibility layer for older UI strings.

## Contributing

Bug reports and focused pull requests are welcome. Include reproduction steps, Chrome/OS versions, and expected behavior. Use sample titles and URLs when sharing examples; avoid posting private browsing data.

Run `npm test` for behavior changes. Keep the [English](README.md) and [Chinese](README.zh-CN.md) introductions aligned when changing features or installation instructions.

## License

[MIT](LICENSE). You may use, modify, and distribute the code under the license terms.
