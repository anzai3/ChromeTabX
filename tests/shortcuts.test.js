import test from 'node:test';
import assert from 'node:assert/strict';
import {safeUrl,DEFAULT_SITES,resolveSlots} from '../shortcuts.js';
test('shortcut URLs accept web links and reject executable schemes and credentials',()=>{
 assert.equal(safeUrl('example.com'),'https://example.com/');
 for(const url of ['javascript://example.com','file:///tmp/test','https://user:pass@example.com',''])assert.equal(safeUrl(url),null);
});
test('custom slots retain their position and recommendations fill remaining slots without duplicates',()=>{
 const a={name:'A',url:'https://a.com/'},b={name:'B',url:'https://b.com/'};
 assert.deepEqual(resolveSlots([a,b],{3:a}),[b,null,null,a,null]);
});

test('dragged links use URI-list before text and reject unsafe drops',async()=>{
 const {droppedSite}=await import('../shortcuts.js');
 const transfer=data=>({getData:type=>data[type]||''});
 assert.deepEqual(droppedSite(transfer({'text/uri-list':'# link\r\nhttps://example.com/path','text/plain':'Other title'})),{name:'example.com',url:'https://example.com/path'});
 assert.equal(droppedSite(transfer({'text/plain':'javascript:alert(1)'})),null);
 assert.equal(droppedSite(transfer({'text/plain':'https://user:pass@example.com'})),null);
 assert.deepEqual(droppedSite(transfer({'text/plain':'https://example.com'})),{name:'example.com',url:'https://example.com/'});
});

test('fixed defaults occupy three slots and leave two available',()=>{
 assert.deepEqual(resolveSlots(DEFAULT_SITES,{}).map(v=>v?.url||null),['https://mail.google.com/','https://chat.deepseek.com/','https://www.feishu.com/',null,null]);
});
