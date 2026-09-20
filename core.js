export function domain(url) { try { return new URL(url).hostname || new URL(url).protocol; } catch { return '未知网站'; } }
export function duplicateGroups(tabs) {
  const groups = new Map();
  for (const tab of tabs) {
    if (!tab.url || !/^https?:\/\//.test(tab.url)) continue;
    const key = `${tab.incognito ? 'private' : 'normal'}:${new URL(tab.url).href}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tab);
  }
  return [...groups.values()].filter(group => group.length > 1).map(group => group.sort((a,b) => Number(!!b.pinned)-Number(!!a.pinned) || Number(!!b.active)-Number(!!a.active) || (b.lastAccessed || 0)-(a.lastAccessed || 0) || a.id-b.id));
}
export function duplicateIds(tabs) { return duplicateGroups(tabs).flatMap(group => group.slice(1).map(tab => tab.id)); }

export function inactiveFor(tab, now = Date.now()) {
  if (tab.active) return 0;
  if (!Number.isFinite(tab.lastAccessed) || tab.lastAccessed <= 0 || tab.lastAccessed > now) return null;
  return now - tab.lastAccessed;
}
export function isInactive(tab, days = 7, now = Date.now()) {
  const age = inactiveFor(tab, now);
  return age !== null && age >= days * 86400000;
}
export function accessLabel(tab, now = Date.now()) {
  if (tab.active) return '当前活动标签';
  const age = inactiveFor(tab, now);
  if (age === null) return '访问时间未知';
  if (age < 60000) return '刚刚访问';
  if (age < 3600000) return `${Math.floor(age / 60000)} 分钟前访问`;
  if (age < 86400000) return `${Math.floor(age / 3600000)} 小时前访问`;
  return `${Math.floor(age / 86400000)} 天未访问`;
}
