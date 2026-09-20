export function safeUrl(value) {
 try { const url=new URL(value.includes('://')?value:`https://${value}`); return /^https?:$/.test(url.protocol)&&!url.username&&!url.password ? url.href : null; } catch{return null;}
}
export const DEFAULT_SITES = [
 {name:'Gmail',url:'https://mail.google.com/'},
 {name:'DeepSeek',url:'https://chat.deepseek.com/'},
 {name:'Feishu',url:'https://www.feishu.com/'}
];
export function resolveSlots(defaults,custom){
 const used=new Set(Object.values(custom).map(v=>v?.url).filter(Boolean));
 const remaining=defaults.filter(v=>!used.has(v.url));
 return Array.from({length:5},(_,i)=>Object.hasOwn(custom,i)?custom[i]:remaining.shift()||null);
}
// Dragged text must be an explicit web URL, never arbitrary text or executable schemes.
export function droppedSite(transfer) {
 const candidates=[transfer.getData('text/uri-list'),transfer.getData('text/plain')];
 for(const data of candidates)for(const line of data.split(/\r?\n/)){
  const value=line.trim();if(!/^https?:\/\//i.test(value))continue;
  const url=safeUrl(value);if(url)return {url,name:new URL(url).hostname.replace(/^www\./,'')};
 }
 return null;
}

export function moveShortcut(slots,from,to){
 const result=[...slots];
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=slots.length||to>=slots.length||!slots[from])return result;
 const [site]=result.splice(from,1);result.splice(to,0,site);return result;
}
