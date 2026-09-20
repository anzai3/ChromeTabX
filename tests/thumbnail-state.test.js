import test from 'node:test';
import assert from 'node:assert/strict';
import {readThumbnail,trustedManager} from '../thumbnail-state.js';
const runtime={id:'abc',getURL:path=>'chrome-extension://abc/'+path};
test('manager sender accepts Chrome new-tab alias but rejects web content and lookalike paths',()=>{
 for(const url of ['chrome-extension://abc/newtab.html','chrome://newtab/'])assert.ok(trustedManager({id:'abc',url},runtime));
 for(const url of ['https://example.com/newtab.html','chrome-extension://abc/newtab.html.evil','chrome-extension://other/newtab.html'])assert.equal(trustedManager({id:'abc',url},runtime),false);
 assert.equal(trustedManager({id:'other',url:'chrome://newtab/'},runtime),false);
});
test('image is retrieved directly from storage without worker response',async()=>{
 const url='https://example.com',image='data:image/webp;base64,AAAA';
 const storage={get:async()=>({'thumb:1':{url,image,time:100}})};
 assert.deepEqual(await readThumbnail(storage,1,url,200),{status:'ready',image});
 assert.deepEqual(await readThumbnail(storage,1,'https://other.com',200),{status:'pending'});
});
test('capture failure is visible and never becomes a fabricated screenshot',async()=>{
 const state={url:'https://example.com',status:'error',error:'Debugger blocked'};
 assert.deepEqual(await readThumbnail({get:async()=>({'thumb-state:1':state})},1,state.url),state);
});
