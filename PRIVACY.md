# ChromeTabX privacy policy

Effective date: September 20, 2026

ChromeTabX is an open-source tab manager maintained at https://github.com/anzai3/ChromeTabX. It replaces the new-tab page to help you find and manage open tabs. No ChromeTabX account is required.

## Information processed on your device

- Open-tab titles, URLs, window IDs and tab status are used to display, search, categorize and manage your tabs. Chrome-provided last-access information may be used for tab filtering.
- Readable page text, document headings and metadata are read for content search, summaries and more useful titles. These values are processed in the extension's memory.
- Page screenshots are captured for card thumbnails, including potentially personal content visible on the page. The extension temporarily attaches Chrome's debugger to eligible background tabs to capture the viewport. Sleeping tabs may be loaded in the background for capture and discarded afterward. It also captures eligible active tabs without switching your tabs.
- Thumbnails and capture status are cached in Chrome session storage, not uploaded to a server. Images expire after six hours and are pruned to a bounded cache. Closing a tab removes its entries. Restarting Chrome, reloading or disabling the extension clears session storage. Error status may include an abbreviated browser error message.
- Your language preference is saved locally in the extension's local storage until changed or the extension is uninstalled. The default follows the browser/system language.
- If you separately install the optional macOS native helper, it reads local Chrome process resource statistics and returns them to the extension. The extension displays aggregate memory usage. The helper is not included in the store package and is not needed for tab management.

The extension does not intentionally capture incognito tabs. Browser-internal pages and pages unavailable to the extension cannot be captured.

## Network activity and sharing

ChromeTabX does not send your browsing data, page text, screenshots or resource statistics to the developer. It has no analytics, advertising, data sale or developer-operated data collection service.

Loading a preview or a sleeping page contacts that page's website. Those requests may use your existing website session, and the website's own privacy policy applies. Page favicons may also load from their original sources. This is ordinary website traffic, not an upload to ChromeTabX. Links to GitHub or any future configured donation provider open that external service; its policies apply. No donation destination is configured in this release.

## Control and deletion

Close the preview to stop its embedded page. Close a tab to remove its cached thumbnail. Disable or uninstall the extension to stop background work. Restart Chrome to clear session thumbnails; uninstall the extension to remove its saved local preference. ChromeTabX does not retain a developer-side copy that needs a separate deletion request.

ChromeTabX uses browsing information only to provide its tab-management features, not for advertising, credit decisions, resale or unrelated purposes. Its use of information is limited to the purposes described here and the Chrome Web Store User Data Policy, including Limited Use requirements.

## Contact and changes

For privacy questions, open an issue at https://github.com/anzai3/ChromeTabX/issues without including private browsing information. Changes to this policy will be published here with an updated effective date.

## 中文说明

ChromeTabX 在本地处理打开标签的标题、网址、状态、可读取正文和网页截图，用于搜索、分类、标题提取和缩略图。截图可能包含网页上的个人内容，但不会上传给开发者。后台截图可能临时加载休眠页面，并使用 Chrome debugger 截取视口。缩略图保存在会话缓存，六小时后过期并受容量限制；关闭标签会删除对应条目，重启 Chrome 或重新加载扩展会清空会话缓存。语言偏好保存在本地，卸载扩展后删除。

预览和临时加载网页会访问原网站，可能使用已有登录状态；网站自身的隐私政策适用。可选 macOS 辅助程序只在本机读取 Chrome 进程资源统计，商店安装包不包含该程序。扩展没有广告、分析追踪或开发者数据收集服务，不出售浏览数据。隐私问题可通过上述 GitHub Issues 联系，请勿公开提交私人网页内容。
