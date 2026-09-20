import test from 'node:test';
import assert from 'node:assert/strict';
import {nextThumbnailTab,captureBackgroundTab,ensureThumbnailAlarm} from '../background-thumbnails.js';
const tab={id:1,url:'https://example.com',status:'complete',active:false};
test('queue prefers loaded pages and skips active, private, audio and recent failures',()=>{
 assert.equal(nextThumbnailTab([{...tab,id:2,discarded:true},tab],{},1000000).id,1);
 assert.equal(nextThumbnailTab([tab],{'thumb-attempt:1':999999},1000000),null);
 for(const change of [{active:true},{incognito:true},{audible:true},{url:'chrome://settings'}])assert.equal(nextThumbnailTab([{...tab,...change}],{},1000000),null);
});
test('background capture detaches debugger on success and failure without activating tab',async()=>{
 for(const fail of [false,true]){
  let detached=0,saved=0;
  const api={tabs:{get:async()=>tab},debugger:{attach:async()=>{},detach:async()=>{detached++;},sendCommand:async()=>{if(fail)throw Error('blocked');return {data:'AAAA'};}},storage:{session:{get:async()=>({}),remove:async()=>{},set:async()=>{saved++;}}}};
  try{await captureBackgroundTab(api,tab,async()=> 'data:image/webp;base64,AAAA');}catch{}
  assert.equal(detached,1);assert.equal(saved,fail?0:1);
 }
});
test('never detaches another debugger if attach failed',async()=>{
 let detached=0;
 const api={tabs:{get:async()=>tab},debugger:{attach:async()=>{throw Error('already attached');},detach:async()=>{detached++;}}};
 await assert.rejects(captureBackgroundTab(api,tab,async()=>''));assert.equal(detached,0);
});


test('worker wakeups preserve the existing alarm deadline',async()=>{
 let alarm={scheduledTime:12345},created=0;
 const alarms={get:async()=>alarm,create:async(name,options)=>{created++;alarm=options;}};
 await ensureThumbnailAlarm(alarms);await ensureThumbnailAlarm(alarms);
 assert.equal(created,0);assert.equal(alarm.scheduledTime,12345);
 alarm=null;await ensureThumbnailAlarm(alarms);
 assert.equal(created,1);assert.equal(alarm.periodInMinutes,0.5);
 await ensureThumbnailAlarm(alarms);assert.equal(created,1);
});


test('queue continues beyond 100 cached pages and prioritizes visible cards',()=>{
 const cache={};
 for(let i=10;i<160;i++)cache[`thumb:${i}`]={time:1000000,url:'https://example.com/'+i,image:'data:image/webp;base64,AAAA'};
 assert.equal(nextThumbnailTab([tab,{...tab,id:2}],cache,1000001,new Set([2])).id,2);
});
