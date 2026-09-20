import {validThumbnail} from './thumbnails.js';

// Only cached screenshots from ordinary active-page browsing are used.
export async function readThumbnail(storage, id, url, now=Date.now()) {
 const key=`thumb:${id}`;
 const entry=(await storage.get(key))[key];
 return validThumbnail(entry,url,now) ? {status:'ready',image:entry.image} : {status:'pending'};
}
