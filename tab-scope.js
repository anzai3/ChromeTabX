// Shared scope for both sidebar counts and visible cards; category membership stays stable.
export function scopeTabs(tabs, windowId = 'all', query = '', bodyMatches = new Map()) {
 const needle = query.trim().toLowerCase();
 return tabs.filter(tab => (windowId === 'all' || tab.windowId === Number(windowId)) &&
  (!needle || `${tab.title || ''} ${tab.url || ''}`.toLowerCase().includes(needle) ||
   (bodyMatches.get(tab.id)?.url === tab.url && bodyMatches.get(tab.id)?.matched)));
}
export function countCategories(tabs, hierarchy) {
 const primary = new Map(), secondary = new Map();
 const ids = new Set(tabs.map(tab => tab.id));
 for(const tab of tabs) {const name=hierarchy.primary.get(tab.id)||'其他';primary.set(name,(primary.get(name)||0)+1);}
 for(const [id,child] of hierarchy.membership)secondary.set(id,child.ids.filter(id=>ids.has(id)).length);
 return {all:tabs.length,primary,secondary};
}
