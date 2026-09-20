export const THUMB_LIMIT = 512;
export const THUMB_TTL = 6 * 60 * 60 * 1000;
export function captureAllowed(tab) {
 return !!tab?.active && !tab.discarded && !tab.incognito && tab.status === 'complete' && /^https?:\/\//.test(tab.url || '');
}
export function validThumbnail(entry, url, now = Date.now()) {
 return entry?.url === url && now - entry.time < THUMB_TTL && /^data:image\/webp;base64,/.test(entry.image || '');
}
export async function captureThumbnail(api, tabId, resize, now = Date.now()) {
 const tab = await api.tabs.get(tabId);
 if(!captureAllowed(tab))return;
 const win = await api.windows.get(tab.windowId);
 if(!win.focused)return;
 const key = `thumb:${tab.id}`;
 const old = (await api.storage.session.get(key))[key];
 if(validThumbnail(old,tab.url,now) && now-old.time<60000)return;
 const data = await api.tabs.captureVisibleTab(tab.windowId,{format:'jpeg',quality:45});
 const current = await api.tabs.get(tab.id);
 if(!captureAllowed(current) || current.url!==tab.url)return;
 const image = await resize(data);
 if(image.length>60000)return;
 await api.storage.session.set({[key]:{url:tab.url,time:now,image}});
 await pruneThumbnails(api,now);
}
export async function pruneThumbnails(api,now=Date.now()) {
 const all = await api.storage.session.get(null);
 const entries = Object.entries(all).filter(([key])=>key.startsWith('thumb:')).sort((a,b)=>b[1].time-a[1].time);
 let bytes=0;
 const remove = entries.filter(([,v],i)=>{bytes+=(v.image?.length||0)*2+1024;return i>=THUMB_LIMIT || bytes>8*1024*1024 || now-v.time>=THUMB_TTL;}).map(([key])=>key);
 if(remove.length)await api.storage.session.remove(remove);
}
