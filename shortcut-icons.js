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
