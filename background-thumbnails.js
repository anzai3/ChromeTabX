import {validThumbnail,pruneThumbnails} from './thumbnails.js';
export function nextThumbnailTab(tabs, cache, now=Date.now(), priorities=new Set()) {
 return tabs.filter(tab=>!tab.active && !tab.incognito && !tab.audible && /^https?:\/\//.test(tab.url||''))
  .filter(tab=>!validThumbnail(cache[`thumb:${tab.id}`],tab.url,now) && now-(cache[`thumb-attempt:${tab.id}`]||0)>5*60*1000)
  .sort((a,b)=>Number(priorities.has(b.id))-Number(priorities.has(a.id)) || Number(!!a.discarded)-Number(!!b.discarded) || (cache[`thumb-attempt:${a.id}`]||0)-(cache[`thumb-attempt:${b.id}`]||0))[0] || null;
}
export async function captureBackgroundTab(api, tab, resize) {
 const target={tabId:tab.id};let attached=false,woke=false;
 const startUrl=tab.url;
 try {
  if(tab.discarded){
   woke=true;await api.tabs.reload(tab.id);
   for(let i=0;i<8;i++){
    await new Promise(resolve=>setTimeout(resolve,1000));
    const current=await api.tabs.get(tab.id);
    if(current.active || current.url!==startUrl)return;
    if(current.status==='complete')break;
   }
  }
  const current=await api.tabs.get(tab.id);
  if(current.active || current.incognito || current.url!==startUrl)throw Error('Page changed during capture');
  if(current.status!=='complete')throw Error('Page has not finished loading');
  await api.debugger.attach(target,'1.3');attached=true;
  let timeout;
  const result=await Promise.race([
   api.debugger.sendCommand(target,'Page.captureScreenshot',{format:'jpeg',quality:40,fromSurface:true,captureBeyondViewport:false,optimizeForSpeed:true}),
   new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Screenshot timed out')),12000);})
  ]).finally(()=>clearTimeout(timeout));
  if(!result?.data)throw Error('Chrome returned no screenshot');
  const image=await resize('data:image/jpeg;base64,'+result.data);
  const after=await api.tabs.get(tab.id);
  if(after.url!==startUrl || after.incognito)throw Error('Page changed during capture');
  if(image.length>60000)throw Error('Thumbnail exceeded size limit');
  await pruneThumbnails(api);
  await api.storage.session.set({[`thumb:${tab.id}`]:{url:startUrl,time:Date.now(),image},[`thumb-state:${tab.id}`]:{url:startUrl,status:'ready'}});
 }finally{
  if(attached)await api.debugger.detach(target).catch(()=>{});
  if(woke){
   const current=await api.tabs.get(tab.id).catch(()=>null);
   if(current && !current.active && !current.audible)await api.tabs.discard(tab.id).catch(()=>{});
  }
 }
}


export async function ensureThumbnailAlarm(alarms) {
 // Recreating an existing alarm resets its deadline whenever the worker wakes.
 if(!await alarms.get('thumbnail-queue')) {
  await alarms.create('thumbnail-queue',{delayInMinutes:0.05,periodInMinutes:0.5});
 }
}
