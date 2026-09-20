import {validThumbnail} from './thumbnails.js';

// Read images directly in the trusted extension page. Content scripts cannot
// read storage.session by default; no image data passes through runtime messages.
export async function readThumbnail(storage, id, url, now=Date.now()) {
 const keys=[`thumb:${id}`,`thumb-state:${id}`];
 const data=await storage.get(keys);
 const entry=data[keys[0]],state=data[keys[1]];
 if(validThumbnail(entry,url,now))return {status:'ready',image:entry.image};
 return state?.url===url ? state : {status:'pending'};
}

export function trustedManager(sender, runtime) {
 if(sender.id!==runtime.id)return false;
 // Chrome can report an override page using either its extension URL or alias.
 try {
  const url=new URL(sender.url);
  const expected=new URL(runtime.getURL('newtab.html'));
  return (url.protocol===expected.protocol && url.host===expected.host && url.pathname===expected.pathname)
   || url.href==='chrome://newtab/' || url.href==='chrome://new-tab-page/';
 }catch{return false;}
}
