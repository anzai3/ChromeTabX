import {test} from 'node:test';
import assert from 'node:assert/strict';
import {duplicateIds, duplicateGroups} from '../core.js';
test('identical URLs deduplicate across windows, preferring pinned tabs',()=>{assert.deepEqual(duplicateIds([{id:1,url:'https://a.com/',windowId:1,active:true},{id:2,url:'https://a.com/',windowId:2,pinned:true}]),[1]);});
test('preserve different queries, fragments, protocols, and private contexts',()=>{const urls=['https://a.com/?q=1','https://a.com/?q=2','https://a.com/#one','https://a.com/#two','http://a.com/','https://a.com/'];assert.deepEqual(duplicateIds([...urls.map((url,id)=>({id,url})),{id:9,url:'https://a.com/',incognito:true}]),[]);});
test('exclude internal pages and missing URL',()=>assert.deepEqual(duplicateIds([{id:1,url:'chrome://settings'},{id:2,url:'chrome://settings'},{id:3}]),[]));
test('active then most recent tab survives',()=>{const tabs=[{id:1,url:'https://a.com',lastAccessed:10},{id:2,url:'https://a.com',lastAccessed:20},{id:3,url:'https://a.com',active:true}];assert.equal(duplicateGroups(tabs)[0][0].id,3);tabs[2].active=false;assert.equal(duplicateGroups(tabs)[0][0].id,2);});
