import test from 'node:test';
import assert from 'node:assert/strict';
import {isGenericTitle,resolveTabTitles} from '../tab-titles.js';

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
