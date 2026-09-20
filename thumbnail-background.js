import {nextThumbnailTab,captureBackgroundTab,ensureThumbnailAlarm} from './background-thumbnails.js';
import {captureThumbnail,validThumbnail} from './thumbnails.js';
let timer,busy=false;
async function resize(data) {
 const bitmap=await createImageBitmap(await (await fetch(data)).blob());
 try {
  const canvas=new OffscreenCanvas(320,180),ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,320,180);
  const scale=Math.min(320/bitmap.width,180/bitmap.height);
  ctx.drawImage(bitmap,0,0,bitmap.width*scale,bitmap.height*scale);
  const blob=await canvas.convertToBlob({type:'image/webp',quality:0.65});
  const bytes=new Uint8Array(await blob.arrayBuffer());
  return 'data:image/webp;base64,'+btoa(String.fromCharCode(...bytes));
 }finally{bitmap.close();}
}
function schedule(tabId){
 clearTimeout(timer);
 timer=setTimeout(async()=>{
  if(busy)return;busy=true;
  try{await captureThumbnail(chrome,tabId,resize);}catch{}finally{busy=false;}
 },1200);
}
chrome.tabs.onActivated.addListener(({tabId})=>schedule(tabId));
chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(tab.active && change.status==='complete')schedule(id);});
chrome.tabs.onRemoved.addListener(id=>chrome.storage.session.remove([`thumb:${id}`,`thumb-attempt:${id}`]).catch(()=>{}));
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL('newtab.html')) || message?.type!=='thumbnail')return;
 (async()=>{
  const tab=await chrome.tabs.get(message.id);
  if(tab.incognito || tab.url!==message.url)return null;
  const key=`thumb:${tab.id}`,entry=(await chrome.storage.session.get(key))[key];
  return validThumbnail(entry,tab.url)?entry.image:null;
 })().then(reply,()=>reply(null));
 return true;
});

// One job per alarm; MV3 can sleep between jobs. Never select or focus a tab.
ensureThumbnailAlarm(chrome.alarms).catch(console.error);
chrome.runtime.onStartup.addListener(()=>ensureThumbnailAlarm(chrome.alarms).catch(console.error));
chrome.alarms.onAlarm.addListener(async alarm=>{
 if(alarm.name!=='thumbnail-queue' || busy)return;
 busy=true;
 try {
  const cache=await chrome.storage.session.get(null);
  const tab=nextThumbnailTab(await chrome.tabs.query({}),cache);
  if(!tab)return;
  await chrome.storage.session.set({[`thumb-attempt:${tab.id}`]:Date.now()});
  await captureBackgroundTab(chrome,tab,resize);
 }catch(error){console.warn('Background thumbnail failed:',error.message);}finally{busy=false;}
});
