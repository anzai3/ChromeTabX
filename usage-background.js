import {addUsage} from './usage.js';
let pending=Promise.resolve();
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message?.type!=='usage-interval'||sender.id!==chrome.runtime.id)return;
 const allowed=[chrome.runtime.getURL('newtab.html'),'chrome://newtab/','chrome://new-tab-page/'];
 if(!allowed.includes(sender.url))return;
 const now=Date.now();
 if(!Number.isFinite(message.start)||!Number.isFinite(message.end)||message.end>now+1000||message.start<now-30000)return;
 pending=pending.catch(()=>{}).then(async()=>{
  const data=await chrome.storage.local.get('usage-time');
  const state=addUsage(data['usage-time'],message.start,message.end);
  await chrome.storage.local.set({'usage-time':state});return state;
 });
 pending.then(reply,()=>reply(null));return true;
});
