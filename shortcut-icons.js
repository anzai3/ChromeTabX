// Prefer the actual icon reported by an open page over Chrome's root-URL cache.
export function iconCandidates(siteUrl,tabs,runtime) {
 const site=new URL(siteUrl);
 const matching=tabs.filter(tab=>{try{return new URL(tab.url).origin===site.origin;}catch{return false;}})
  .sort((a,b)=>Number(b.url===siteUrl)-Number(a.url===siteUrl));
 const icons=matching.map(tab=>tab.favIconUrl).filter(url=>typeof url==='string'&&(/^https?:\/\//i.test(url)||/^data:image\//i.test(url)));
 icons.push(new URL('/favicon.ico',site).href);
 if(runtime?.getURL){
  for(const page of [...matching.map(tab=>tab.url),siteUrl]){
   const cached=new URL(runtime.getURL('/_favicon/'));cached.searchParams.set('pageUrl',page);cached.searchParams.set('size','32');icons.push(cached.href);
  }
 }
 return [...new Set(icons)].slice(0,8);
}
export function loadShortcutIcon(img,fallback,candidates) {
 let index=0,timer;
 const next=()=>{
  clearTimeout(timer);
  img.hidden=true;
  if(index>=candidates.length){img.remove();fallback.hidden=false;return;}
  img.src=candidates[index++];timer=setTimeout(next,3500);
 };
 img.referrerPolicy='no-referrer';
 img.onload=()=>{clearTimeout(timer);img.hidden=false;fallback.hidden=true;};
 img.onerror=next;
 next();
}

export function declaredIcons(doc,pageUrl) {
 let base=pageUrl;
 try{const href=doc.querySelector('base[href]')?.getAttribute('href');if(href)base=new URL(href,pageUrl).href;}catch{}
 const result=[];
 for(const node of doc.querySelectorAll('link[rel][href]')){
  if(!node.getAttribute('rel').toLowerCase().split(/\s+/).some(r=>r==='icon'||r==='apple-touch-icon'))continue;
  try{const url=new URL(node.getAttribute('href'),base);if(/^https?:$/.test(url.protocol))result.push(url.href);}catch{}
 }
 return [...new Set(result)].slice(0,6);
}
const discoveries=new Map();
export function discoverIcons(url) {
 const origin=new URL(url).origin;
 if(!discoveries.has(origin))discoveries.set(origin,(async()=>{
  try{
   const response=await fetch(origin+'/',{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(4500)});
   if(!response.ok||!response.body)return [];
   const reader=response.body.getReader(),decoder=new TextDecoder();let html='',bytes=0;
   try{while(bytes<262144){const {value,done}=await reader.read();if(done)break;bytes+=value.length;html+=decoder.decode(value,{stream:true});if(/<\/head\s*>/i.test(html))break;}}finally{await reader.cancel();}
   return declaredIcons(new DOMParser().parseFromString(html,'text/html'),response.url||origin+'/');
  }catch{return [];}
 })());
 return discoveries.get(origin);
}
