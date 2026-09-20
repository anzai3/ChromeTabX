// ChromeTabX-only compatibility catalog. New apps use stable message keys.
export const translations = {
 '设置':'Settings','关闭设置':'Close settings',
 '标签管家':'Tab Manager','Tab Matrix · 标签矩阵':'Tab Matrix','Chrome 资源占用':'Chrome resource usage','Chrome 占用':'Chrome usage','刷新资源占用':'Refresh resource usage','内存':'Memory','正在连接…':'Connecting…','指标说明与连接':'Metrics & connection',
 '统计本机所有 Google Chrome 窗口及辅助进程。内存为 RSS 合计（共享页可能重复计算）；CPU 为 1 秒采样，单核 100%，多核可超过 100%。':'Includes all local Google Chrome windows and helper processes. Memory is total RSS (shared pages may be counted more than once). CPU is sampled over one second; 100% equals one core.',
 '每 10 秒刷新，关闭标签后重新采样。数值变化也受其他页面影响，不等同于单个标签释放量。':'Refreshes every 10 seconds and after closing tabs. Changes include activity from other pages and do not measure memory freed by a single tab.',
 '未连接时，请按项目 README 安装 macOS 本机采集程序，并重新加载扩展。':'If disconnected, install the macOS helper as described in the README, then reload the extension.',
 '分类云':'Categories','全部':'All','其他':'Other','全部标签':'All tabs','重复标签':'Duplicates','固定标签':'Pinned','久未访问':'Inactive','你的数字世界，尽在此处。':'All your tabs in one place.','搜索和管理所有打开的网页。':'Search and manage all your open pages.',
 '⌁ 清理重复标签':'⌁ Remove duplicates','清理重复标签':'Remove duplicate tabs','整理重复页面':'Review duplicate tabs','搜索标题、网址或网页正文…':'Search titles, URLs, or page content…','搜索标题、网址或网页正文':'Search titles, URLs, or page content','筛选窗口':'Filter windows','所有窗口':'All windows','切换列表视图':'Switch to list view','切换卡片视图':'Switch to card view','预览模式 · 当前展示示例标签。加载为 Chrome 扩展后，将显示你的真实标签。':'Preview mode · Sample tabs. Load this as a Chrome extension to manage your real tabs.',
 '未访问时长':'Inactive for','重新搜索正文':'Search content again','本地运行 · 数据只留在你的浏览器':'Runs locally · Your data stays in your browser','整理标签，专注当下。':'Organize your tabs. Stay focused.',
 '按完整网址匹配，仅处理 HTTP / HTTPS 页面。优先保留固定页、当前活动页，再保留最近使用的一页。关闭可能丢失未提交内容。':'Matches identical HTTP/HTTPS URLs. Keeps pinned tabs first, then active tabs, then the most recently used tab. Closing a tab may discard unsaved work.',
 '取消':'Cancel','确认清理':'Remove duplicates','采样中…':'Sampling…','预览模式 · 无实时数据':'Preview · No live metrics','请重新加载扩展以启用本机通信':'Reload the extension to enable native messaging','本机采集未连接':'Local helper disconnected','采集失败':'Sampling failed','正文命中':'Content match','重复':'Duplicate','固定标签':'Pinned tabs','固定':'Pin','取消固定':'Unpin','关闭标签':'Close tab','当前活动标签':'Active tab','访问时间未知':'Last visit unknown','刚刚访问':'Just visited','未命名标签':'Untitled tab','没有重复标签。':'No duplicate tabs.','这里暂时没有标签。':'No tabs here yet.','正在搜索正文…':'Searching page content…','没有找到匹配的标签。':'No matching tabs.','换个关键词，或调整窗口筛选。':'Try another keyword or window filter.','没有发现相同网址的重复页面。':'No pages with identical URLs found.','没有符合此时长的标签，可以缩短筛选时长。':'No tabs match this duration. Try a shorter period.','打开一些网页，或者选择其他视图。':'Open some pages or select another view.','相同网址，只留一个。清理操作覆盖所有窗口。':'Keep one tab per URL. Cleanup applies to all windows.','久未访问 · 最久优先':'Inactive · Oldest first','标签已关闭':'Tab closed','预览模式：加载扩展后可跳转到真实标签':'Preview: load the extension to switch to real tabs','语言':'Language','跟随系统':'System default'
};
export function translateText(text) {
 const trimmed=text.trim();
 if(translations[trimmed])return text.replace(trimmed,translations[trimmed]);
 const patterns=[
 [/^窗口 (\d+)$/,'Window $1'],[/^至少 (\d+) 天$/,'At least $1 days'],[/^(\d+) 天未访问$/,'Not visited for $1 days'],[/^(\d+) 小时前访问$/,'Visited $1 hours ago'],[/^(\d+) 分钟前访问$/,'Visited $1 minutes ago'],
 [/^(\d+) 个进程 · 刚刚更新$/,'$1 processes · Updated just now'],[/^较上次内存 (.+)$/,'Memory change: $1'],[/^操作未完成：(.+)$/,'Action failed: $1'],
 [/^正在搜索网页正文… (.+)$/,'Searching page content… $1'],
 [/^找到 (\d+) 个标签（当前筛选） · 已搜索 (\d+) 页正文 · (\d+) 页正文不可读取，仅匹配标题和网址$/,'$1 matching tabs · $2 pages searched · $3 unavailable (title and URL only)'],
 [/^查看至少 (\d+) 天没有切换到的标签。$/,'Tabs not visited for at least $1 days.'],
 [/^按最久未访问优先排列 · 不含各窗口当前活动标签$/,'Oldest first · Active tabs excluded'],
 [/^按最久未访问优先排列 · 不含各窗口当前活动标签 · (\d+) 个标签访问时间未知，未计入$/,'Oldest first · Active tabs excluded · $1 tabs with unknown visit times excluded'],
 [/^将关闭 (\d+) 个重复标签，覆盖所有窗口，每个相同网址保留 1 个。$/,'Close $1 duplicate tabs across all windows, keeping one per URL.'],
 [/^已清理 (\d+) 个重复标签$/,'Closed $1 duplicate tabs'],[/^已清理 (\d+) 个重复标签，部分标签已变更或无法关闭$/,'Closed $1 duplicate tabs; some tabs changed or could not be closed']
 ];
 for(const [pattern,replacement] of patterns)if(pattern.test(trimmed))return text.replace(trimmed,trimmed.replace(pattern,replacement));
 return text;
}
