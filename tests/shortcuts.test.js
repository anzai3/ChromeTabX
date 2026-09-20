import test from 'node:test';
import assert from 'node:assert/strict';
import {safeUrl,rankSites,resolveSlots,recentSites} from '../shortcuts.js';
test('shortcut URLs accept web links and reject executable schemes and credentials',()=>{
 assert.equal(safeUrl('example.com'),'https://example.com/');
 for(const url of ['javascript://example.com','file:///tmp/test','https://user:pass@example.com',''])assert.equal(safeUrl(url),null);
});
test('recommendations count recent visits and combine pages at the same origin',()=>{
 const records=[{url:'https://a.com/one',visits:[{visitTime:101},{visitTime:102}]},{url:'https://a.com/two',visits:[{visitTime:103}]},{url:'https://b.com',visits:[{visitTime:99},{visitTime:104}]}];
 assert.deepEqual(rankSites(records,100),[{name:'a.com',url:'https://a.com/'},{name:'b.com',url:'https://b.com/'}]);
});
test('custom slots retain their position and recommendations fill remaining slots without duplicates',()=>{
 const a={name:'A',url:'https://a.com/'},b={name:'B',url:'https://b.com/'};
 assert.deepEqual(resolveSlots([a,b],{3:a}),[b,null,null,a,null]);
});
test('history lookup bounds requests to four concurrent calls',async()=>{
 let active=0,max=0;
 const sites=await recentSites({search:async query=>{assert.equal(query.maxResults,500);return Array.from({length:12},(_,i)=>({url:`https://site${i}.com`}));},getVisits:async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,1));active--;return [{visitTime:10000000000}];}},10000000000);
 assert.equal(max,4);assert.equal(sites.length,5);
});

test('dragged links use URI-list before text and reject unsafe drops',async()=>{
 const {droppedSite}=await import('../shortcuts.js');
 const transfer=data=>({getData:type=>data[type]||''});
 assert.deepEqual(droppedSite(transfer({'text/uri-list':'# link\r\nhttps://example.com/path','text/plain':'Other title'})),{name:'example.com',url:'https://example.com/path'});
 assert.equal(droppedSite(transfer({'text/plain':'javascript:alert(1)'})),null);
 assert.equal(droppedSite(transfer({'text/plain':'https://user:pass@example.com'})),null);
 assert.deepEqual(droppedSite(transfer({'text/plain':'https://example.com'})),{name:'example.com',url:'https://example.com/'});
});
