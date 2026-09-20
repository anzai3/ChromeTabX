import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewReader} from '../page-preview.js';
test('preview skips sleeping tabs and protected URLs',async()=>{
 let calls=0;const read=createPreviewReader(async()=>{calls++;return [];});
 assert.equal((await read({id:1,url:'chrome://settings'})).state,'unavailable');
 assert.equal((await read({id:2,url:'https://example.com',discarded:true})).state,'unavailable');
 assert.equal(calls,0);
});
test('preview rejects stale navigation and handles denied access',async()=>{
 const read=createPreviewReader(async()=>[{frameId:0,result:{url:'https://other.test',summary:'wrong'}}]);
 assert.equal((await read({id:1,url:'https://example.com'})).state,'unavailable');
 const denied=createPreviewReader(async()=>{throw Error('denied')});
 assert.equal((await denied({id:1,url:'https://example.com'})).state,'unavailable');
});
test('preview caches concurrent reads, expires and limits returned text',async()=>{
 let calls=0,time=0;const tab={id:1,url:'https://example.com'};
 const read=createPreviewReader(async()=>{calls++;return [{frameId:0,result:{url:tab.url,summary:'x'.repeat(500),excerpt:'y'.repeat(3000)}}]},()=>time);
 const result=await Promise.all([read(tab),read(tab)]);
 assert.equal(calls,1);assert.equal(result[0].summary.length,180);assert.equal(result[0].excerpt.length,1400);
 time=60001;await read(tab);assert.equal(calls,2);
});
