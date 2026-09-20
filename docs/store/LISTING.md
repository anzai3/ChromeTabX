# Chrome Web Store listing copy

Submission status: prepared locally; not uploaded or submitted. Default listing language: English. Add Simplified Chinese as a listing translation.

## English

Name: ChromeTabX — Tab Manager

Summary: Find open tabs fast. Search across windows, browse by topic, preview pages, and close duplicate tabs from your new-tab page.

Description:

Too many tabs, and you cannot find the one you need?

ChromeTabX turns your new-tab page into a searchable dashboard of the tabs you already have open. Type a word you remember, find the page, and jump back to work.

• Search titles, URLs and readable text in loaded pages.
• See tabs from all Chrome windows together.
• Open five frequent websites beside search; customize each shortcut or drag a web link onto its icon.
• Browse automatically generated topic categories.
• Preview a page before switching to its original tab.
• Review duplicate URLs and close extra copies.
• Use English or Simplified Chinese, following your system language by default.

Closing unneeded tabs can free memory and help Chrome stay responsive. Results depend on the pages you close; ChromeTabX does not promise a fixed speed increase.

No account, no analytics, no developer upload of your browsing data. Search and thumbnail processing happen on your device. Previews still contact the original websites.

Thumbnails are cached when you normally view eligible pages. Pages you have not viewed may have no thumbnail. No debugger is attached. Some sites block embedded previews or require you to open the original tab. Browser-internal pages cannot be read. The optional macOS memory monitor requires a separately installed helper; all tab-management features work without it.

Open source: https://github.com/anzai3/ChromeTabX
Support: https://github.com/anzai3/ChromeTabX/issues
Privacy: https://github.com/anzai3/ChromeTabX/blob/main/PRIVACY.md

## 简体中文

名称：ChromeTabX — 标签管理器

简短介绍：把新标签页变成标签管理中心，跨窗口搜索网页、按主题分类、预览页面、清理重复标签，少花时间翻找。

详细介绍：

标签开得太多，想用的网页却找不到？

ChromeTabX 把新标签页变成已打开网页的搜索和管理页面。输入记得的词，找到网页，快速回到工作。

• 搜索标题、网址和已加载页面的可读取正文。
• 集中查看所有 Chrome 窗口的标签。
• 搜索框旁显示五个常用网址，每个都能自定义，也可拖入网址生成图标入口。
• 按自动生成的主题分类浏览。
• 先预览网页，再切换到原标签。
• 检查重复网址，关闭多余页面。
• 支持英文和简体中文，默认跟随系统语言。

关闭不需要的标签有助于释放内存、保持浏览器流畅，实际效果取决于页面内容，不承诺固定的提速幅度。

无需注册，没有分析追踪，也不会向开发者上传浏览数据。搜索和缩略图处理在本机完成；预览仍会访问原网站。

正常浏览符合条件的网页时缓存缩略图，尚未浏览的页面可能没有缩略图。不使用调试接口。部分网站禁止嵌入预览或需要打开原标签；浏览器内部页面无法读取。可选的 macOS 内存监控需要另行安装本地辅助程序，不影响标签管理功能。

项目、支持及隐私政策链接同上。

## Dashboard fields

- Single purpose: Help users find, preview and manage their currently open Chrome tabs from the new-tab page.
- Website: https://github.com/anzai3/ChromeTabX
- Support: https://github.com/anzai3/ChromeTabX/issues
- Privacy policy: https://github.com/anzai3/ChromeTabX/blob/main/PRIVACY.md
- Suggested category: Productivity (select the closest current dashboard category).
- Distribution: Public, free. Confirm available country/trader fields in the owner's dashboard; do not invent personal or legal details.

### Permission justifications

| Permission | Explanation for the reviewer |
| --- | --- |
| favicon | Display Chrome-provided website icons for the five local shortcuts. |
| history | Read up to 500 recently visited URLs and visit timestamps to rank frequent websites over the last 30 days, locally only. |
| tabs | List open tabs across windows, read titles/URLs/status, switch to the chosen tab, and close tabs or confirmed duplicate URLs. |
| scripting | Read document titles, headings, metadata and readable text from existing tabs for local search, summaries and improved titles. |
| storage | Cache small page thumbnails and capture state locally in session storage; no server upload. |
| nativeMessaging | Communicate with the separately installed optional local macOS Chrome-resource helper for the memory display. The extension works without the helper. |
| <all_urls> | Support the user's open HTTP/HTTPS pages across arbitrary sites: read content for search/title extraction and capture eligible page thumbnails. There is no fixed domain list because users manage tabs from different sites. |

### Privacy declarations

No developer collection, transmission, sale or analytics. The extension locally handles browsing activity (open-tab URLs/titles) and website content (text and screenshots). Do not declare that the extension never accesses user data. Reconcile these descriptions with the exact dashboard question wording when access is available. No authentication information is extracted, although screenshots and page text may contain information displayed by a signed-in site. Embedded sites may use their own sessions.

Packaged extension logic only: no downloaded JavaScript executed as extension code. Preview iframes load ordinary external websites in a sandbox; explain that separately if the reviewer asks about remote content.

### Reviewer steps

1. Install the ZIP and open several ordinary HTTP/HTTPS pages across two Chrome windows.
2. Open a new tab. Search a title or URL, choose a category, and click a card to switch to its original tab.
3. Open a duplicate URL and review the duplicate cleanup action before confirming it.
4. Hover over Preview on a page that permits embedding; close it or open the original tab. Sites may deny embedding.
5. View an eligible HTTP/HTTPS page in a focused window, wait briefly, then return to the manager and check its thumbnail. Pages without a cached image leave that area empty. Verify this in Chrome before submission.
6. Open Settings and change the language. No account or test credentials are required.
7. The optional memory helper is not included and is not needed to review the core extension.
