import {titleSubject} from './title-rules.js';

export function isGenericTitle(title) {
 return /^(?:docs?|documents?|文档|云文档|飞书(?:云文档|文档)?|feishu(?: docs)?|lark(?: docs)?|untitled|无标题)?$/i.test(titleSubject(title).trim());
}

const titleCache = new Map();

// Runs only in already-loaded pages; never navigates or wakes discarded tabs.
export function readDocumentTitle() {
 const clean = value => String(value || '').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').replace(/\s+/g,' ').trim();
 const generic = value => /^(?:docs?|documents?|文档|云文档|飞书(?:云文档|文档)?|feishu(?: docs)?|lark(?: docs)?|untitled|无标题)?$/i.test(clean(value).replace(/\s*[-|–—]\s*(?:飞书云文档|feishu docs|lark docs)$/i,''));
 let title = clean(document.title);
 if(generic(title)) {
  // Prefer document-title elements over arbitrary body text or sidebar headings.
  const selectors = [
   '[data-testid="document-title"]', '.docs-title-input', '.docx-title-block',
   '.suite-title-input', 'main h1', 'article h1', '[role="main"] [role="heading"][aria-level="1"]',
   'meta[property="og:title"]', 'meta[name="twitter:title"]'
  ];
  for(const selector of selectors) {
   const node = document.querySelector(selector);
   const candidate = clean(node?.content || node?.value || node?.innerText || node?.textContent);
   if(candidate && candidate.length <= 300 && !generic(candidate)) {title=candidate;break;}
  }
 }
 return {url:location.href,title};
}

export async function resolveTabTitles(tabs, read, cache = titleCache) {
 const ids = new Set(tabs.map(tab => tab.id));
 for(const id of cache.keys())if(!ids.has(id))cache.delete(id);
 const resolved = tabs.map(tab => {
  const old = cache.get(tab.id);
  if(old && old.url !== tab.url)cache.delete(tab.id);
  if(!isGenericTitle(tab.title))cache.set(tab.id,{url:tab.url,title:tab.title});
  return {...tab,title:isGenericTitle(tab.title) && old?.url === tab.url ? old.title : tab.title};
 });
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
    if(result?.url === tab.url && typeof result.title === 'string' && !isGenericTitle(result.title)) {
     tab.title = result.title;
     cache.set(tab.id,{url:tab.url,title:result.title});
    }
   } catch { /* Keep Chrome's title when page access is unavailable. */ }
   finally {clearTimeout(timer);}
  }
 }));
 return resolved;
}
