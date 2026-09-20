// Runs in the page's isolated world. Return only a match excerpt, not the full page.
export function findPageText(query) {
  const text = (document.body?.innerText || '').replace(/\s+/g, ' ');
  const needle = query.trim().replace(/\s+/g, ' ').toLowerCase();
  const index = needle ? text.toLowerCase().indexOf(needle) : -1;
  return {url: location.href, matched: index >= 0, snippet: index < 0 ? '' : `${index > 65 ? '…' : ''}${text.slice(Math.max(0,index-65),index+needle.length+110)}${index+needle.length+110 < text.length ? '…' : ''}`};
}
export async function scanTabs(tabs, query, read, publish, current = () => true) {
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(4,tabs.length)}, async () => {
    while (current() && cursor < tabs.length) {
      const tab = tabs[cursor++];
      let result;
      if (!/^https?:\/\//.test(tab.url || '') || tab.discarded) result = {state:'unavailable'};
      else {
        let timeout;
        try {
          const frames = await Promise.race([read(tab,query),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('timeout')),5000);})]);
          const page = frames.find(frame => frame.frameId === 0)?.result;
          result = page?.url === tab.url ? {state:'done',...page} : {state:'unavailable'};
        } catch { result = {state:'unavailable'}; }
        finally {clearTimeout(timeout);}
      }
      if(current()) publish(tab,{url:tab.url,...result});
    }
  }));
}
