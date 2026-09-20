import test from 'node:test';
import assert from 'node:assert/strict';
import {isGenericTitle,readDocumentTitle,resolveTabTitles as resolve} from '../tab-titles.js';

const resolveTabTitles = (tabs,read) => resolve(tabs,read,new Map());

test('generic document titles are detected without replacing specific names', () => {
 for(const title of ['Docs','文档','文档 - 飞书云文档',''])assert.equal(isGenericTitle(title),true);
 for(const title of ['季度复盘 - 飞书云文档','Docs migration plan'])assert.equal(isGenericTitle(title),false);
});
test('loaded actual title replaces placeholder and preserves source tabs', async () => {
 const tabs = [{id:1,title:'Docs',url:'https://example.com/doc'}];
 const result = await resolveTabTitles(tabs,async tab => [{frameId:0,result:{url:tab.url,title:'季度复盘 - 飞书云文档'}}]);
 assert.equal(result[0].title,'季度复盘 - 飞书云文档');
 assert.equal(tabs[0].title,'Docs');
});
test('discarded, protected and specific titles are never read', async () => {
 const tabs = [{title:'Docs',discarded:true,url:'https://example.com'}, {title:'Docs',url:'chrome://settings'}, {title:'具体标题',url:'https://example.com'}];
 assert.deepEqual(await resolveTabTitles(tabs,()=>assert.fail('unexpected read')),tabs);
});
test('navigation races, child frames, generic results and permission failures keep original title', async () => {
 const tabs = [1,2,3,4].map(id=>({id,title:'Docs',url:'https://example.com/doc'}));
 const result = await resolveTabTitles(tabs,async tab => {
  if(tab.id===4)throw Error('permission denied');
  return [{frameId:tab.id===2?1:0,result:{url:tab.id===1?'https://example.com/other':tab.url,title:tab.id===3?'文档':'Other document'}}];
 });
 assert.deepEqual(result,tabs);
});


test('recovered title survives placeholder refreshes but never leaks across navigation', async () => {
 const cache=new Map();
 const tab={id:1,url:'https://example.com/a',title:'Docs'};
 await resolve([tab],async()=>[{frameId:0,result:{url:tab.url,title:'2026 H1 复盘 · Bill'}}],cache);
 assert.equal((await resolve([tab],()=>assert.fail('cached'),cache))[0].title,'2026 H1 复盘 · Bill');
 assert.equal((await resolve([{...tab,url:'https://example.com/b'}],async()=>[],cache))[0].title,'Docs');
});

test('generic document.title falls back to visible document heading', () => {
 const oldDoc=globalThis.document,oldLocation=globalThis.location;
 try {
  globalThis.location={href:'https://example.com/doc'};
  globalThis.document={title:'Docs',querySelector:selector=>selector==='main h1'?{innerText:'2026 H1 复盘 · Bill'}:null};
  assert.equal(readDocumentTitle().title,'2026 H1 复盘 · Bill');
  document.title='具体网页标题';
  assert.equal(readDocumentTitle().title,'具体网页标题');
 } finally {globalThis.document=oldDoc;globalThis.location=oldLocation;}
});
