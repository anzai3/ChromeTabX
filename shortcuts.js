export function safeUrl(value) {
 try { const url=new URL(value.includes('://')?value:`https://${value}`); return /^https?:$/.test(url.protocol)&&!url.username&&!url.password ? url.href : null; } catch{return null;}
}
export function rankSites(records,startTime) {
 const sites=new Map();
 for(const {url,visits} of records){
  const href=safeUrl(url);if(!href)continue;
  const origin=new URL(href).origin;
  const recent=visits.filter(v=>v.visitTime>=startTime);if(!recent.length)continue;
  const old=sites.get(origin)||{url:origin+'/',name:new URL(origin).hostname.replace(/^www\./,''),count:0,last:0};
  old.count+=recent.length;old.last=Math.max(old.last,...recent.map(v=>v.visitTime));sites.set(origin,old);
 }
 return [...sites.values()].sort((a,b)=>b.count-a.count||b.last-a.last||a.url.localeCompare(b.url)).slice(0,5).map(({url,name})=>({url,name}));
}
export function resolveSlots(defaults,custom){
 const used=new Set(Object.values(custom).map(v=>v?.url).filter(Boolean));
 const remaining=defaults.filter(v=>!used.has(v.url));
 return Array.from({length:5},(_,i)=>custom[i]||remaining.shift()||null);
}
export async function recentSites(history,now=Date.now()) {
 const startTime=now-30*86400000;
 const items=await history.search({text:'',startTime,maxResults:500});
 const records=[];let index=0;
 await Promise.all(Array.from({length:4},async()=>{
  while(index<items.length){const item=items[index++];if(!safeUrl(item.url||''))continue;
   const visits=await history.getVisits({url:item.url});records.push({url:item.url,visits});
  }
 }));
 return rankSites(records,startTime);
}
