import {titleSubject} from './title-rules.js';

export function isGenericTitle(title) {
 return /^(?:docs?|documents?|文档|云文档|飞书(?:云文档|文档)?|feishu(?: docs)?|lark(?: docs)?|untitled|无标题)?$/i.test(titleSubject(title).trim());
}

// Runs only in already-loaded pages; never navigates or wakes discarded tabs.
export function readDocumentTitle() {
 return {url:location.href,title:document.title};
}

export async function resolveTabTitles(tabs, read) {
 const resolved = tabs.map(tab => ({...tab}));
 const candidates = resolved.filter(tab => isGenericTitle(tab.title) && !tab.discarded && /^https?:\/\//.test(tab.url || ''));
 let next = 0;
 await Promise.all(Array.from({length:Math.min(3,candidates.length)}, async () => {
  while(next < candidates.length) {
   const tab = candidates[next++];
   let timer;
   try {
    const frames = await Promise.race([read(tab), new Promise((_,reject) => {
     timer = setTimeout(() => reject(Error('timeout')), 3000);
    })]);
    const result = frames.find(frame => frame.frameId === 0)?.result;
    if(result?.url === tab.url && typeof result.title === 'string' && !isGenericTitle(result.title)) tab.title = result.title;
   } catch { /* Keep Chrome's title when page access is unavailable. */ }
   finally {clearTimeout(timer);}
  }
 }));
 return resolved;
}
