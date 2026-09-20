import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPageText,scanTabs} from '../content-search.js';
test('body-only Chinese and case insensitive matches return excerpts',()=>{
 globalThis.document={body:{innerText:'项目计划\n  Full TEXT Search 需要完成'}};globalThis.location={href:'https://example.com/'};
 assert.equal(findPageText('项目计划').matched,true);
 assert.equal(findPageText('full text').matched,true);
 assert.equal(findPageText('missing').matched,false);
 assert.equal(findPageText('  ').matched,false);
 delete globalThis.document;delete globalThis.location;
});
test('permission failures, discarded tabs and stale navigation do not match',async()=>{
 const results=new Map();let calls=0;
 await scanTabs([{id:1,url:'chrome://settings'},{id:2,url:'https://a/',discarded:true},{id:3,url:'https://b/'},{id:4,url:'https://c/'}],'query',async tab=>{calls++;if(tab.id===3)throw Error('denied');return [{frameId:0,result:{url:'https://changed/',matched:true}}];},(tab,result)=>results.set(tab.id,result));
 assert.equal(calls,2);assert.equal(results.size,4);assert.ok([...results.values()].every(r=>r.state==='unavailable'));
});
test('old queries cannot publish late results',async()=>{
 let current=true,published=0;
 await scanTabs([{id:1,url:'https://a/'}],'old',async()=>{current=false;return [{frameId:0,result:{url:'https://a/',matched:true}}];},()=>published++,()=>current);
 assert.equal(published,0);
});
test('bounded concurrency and successful content match',async()=>{
 let active=0,max=0;const results=[];
 await scanTabs(Array.from({length:10},(_,id)=>({id,url:'https://a/'})),'test',async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,5));active--;return [{frameId:0,result:{url:'https://a/',matched:true,snippet:'test'}}];},(_,r)=>results.push(r));
 assert.equal(max,4);assert.equal(results.length,10);assert.ok(results.every(r=>r.matched));
});
