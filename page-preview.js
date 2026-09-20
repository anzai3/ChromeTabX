// Runs in an isolated page context. No full-page storage, screenshots, or network requests.
export function extractPagePreview() {
 const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
 const description = clean(document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content);
 const body = clean((document.querySelector('main,article') || document.body)?.innerText).slice(0,1400);
 return {url:location.href, summary:(description || body).slice(0,180), excerpt:body || description.slice(0,1400)};
}

export function createPreviewReader(read, now = Date.now) {
 const cache = new Map();
 return async tab => {
  if (!/^https?:\/\//.test(tab.url || '') || tab.discarded) return {state:'unavailable'};
  const key = `${tab.id}:${tab.url}`;
  const old = cache.get(key);
  if(old && now()-old.time<60000)return old.promise;
  const promise = (async()=>{
   let timer;
   try {
    const frames = await Promise.race([read(tab),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),5000);})]);
    const data = frames.find(f=>f.frameId===0)?.result;
    return data?.url===tab.url && (data.summary || data.excerpt) ? {state:'done',summary:String(data.summary||'').slice(0,180),excerpt:String(data.excerpt||'').slice(0,1400)} : {state:'unavailable'};
   } catch {return {state:'unavailable'};} finally {clearTimeout(timer);}
  })();
  cache.set(key,{time:now(),promise});
  if(cache.size>300)cache.delete(cache.keys().next().value);
  return promise;
 };
}
