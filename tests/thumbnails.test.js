import test from 'node:test';
import assert from 'node:assert/strict';
import {captureAllowed,validThumbnail,captureThumbnail,THUMB_TTL,THUMB_LIMIT} from '../thumbnails.js';
const tab={id:1,windowId:2,url:'https://example.com',active:true,status:'complete'};
const image='data:image/webp;base64,AAAA';
function fixture(){
 const store={},stats={captures:0};
 const api={tabs:{get:async()=>({...tab}),captureVisibleTab:async()=>{stats.captures++;return 'screenshot';}},windows:{get:async()=>({focused:true})},storage:{session:{get:async key=>key?{[key]:store[key]}:{...store},set:async values=>Object.assign(store,values),remove:async keys=>{for(const k of Array.isArray(keys)?keys:[keys])delete store[k];}}}};
 return {api,store,stats};
}
test('only loaded active ordinary web tabs may be captured',()=>{
 assert.equal(captureAllowed(tab),true);
 for(const change of [{incognito:true},{discarded:true},{active:false},{status:'loading'},{url:'chrome://settings'},{url:'file:///private.txt'}])assert.equal(captureAllowed({...tab,...change}),false);
});
test('cache checks URL and expires old images',()=>{
 const entry={url:tab.url,image,time:100};
 assert.equal(validThumbnail(entry,tab.url,101),true);
 assert.equal(validThumbnail(entry,'https://other.com',101),false);
 assert.equal(validThumbnail(entry,tab.url,100+THUMB_TTL),false);
});
test('capture is resized and repeated visits are throttled',async()=>{
 const {api,store,stats}=fixture();
 await captureThumbnail(api,1,async()=>image,1000);
 await captureThumbnail(api,1,async()=>image,1001);
 assert.equal(stats.captures,1);assert.equal(store['thumb:1'].image,image);
});
test('never capture background windows or save a navigated tab',async()=>{
 const {api,store,stats}=fixture();
 api.windows.get=async()=>({focused:false});
 await captureThumbnail(api,1,async()=>image,1000);assert.equal(stats.captures,0);
 api.windows.get=async()=>({focused:true});let reads=0;
 api.tabs.get=async()=>({...tab,url:++reads===1?tab.url:'https://other.com'});
 await captureThumbnail(api,1,async()=>image,1000);assert.deepEqual(store,{});
});
test('cache is bounded to the thumbnail limit',async()=>{
 const {api,store}=fixture();
 for(let id=2;id<THUMB_LIMIT+3;id++)store[`thumb:${id}`]={url:tab.url,time:1,image};
 await captureThumbnail(api,1,async()=>image,1000);
 assert.equal(Object.keys(store).length,THUMB_LIMIT);assert.ok(store['thumb:1']);
});
