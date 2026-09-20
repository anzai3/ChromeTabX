import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scopeTabs,countCategories} from '../tab-scope.js';
const tabs=[{id:1,windowId:1,title:'Mico report',url:'https://a.test'},...Array.from({length:4},(_,i)=>({id:i+2,windowId:2,title:'Mico Indonesia',url:`https://b.test/${i}`}))];
const hierarchy={primary:new Map(tabs.map(t=>[t.id,'Mico'])),membership:new Map([['mico-id',{ids:[2,3,4,5]}]])};
test('four tabs in another window count as zero in the current window',()=>{
 const scoped=scopeTabs(tabs,'1');const counts=countCategories(scoped,hierarchy);
 assert.equal(counts.all,1);assert.equal(counts.primary.get('Mico'),1);assert.equal(counts.secondary.get('mico-id'),0);
 const all=countCategories(scopeTabs(tabs,'all'),hierarchy);
 assert.equal(all.all,5);assert.equal(all.secondary.get('mico-id'),4);
});
test('search and URL-valid body matches drive counts and cards together',()=>{
 const matches=new Map([[2,{url:'https://b.test/0',matched:true}],[3,{url:'https://stale.test',matched:true}]]);
 const scoped=scopeTabs(tabs,'2','needle',matches);
 assert.deepEqual(scoped.map(t=>t.id),[2]);
 const counts=countCategories(scoped,hierarchy);assert.equal(counts.all,1);assert.equal(counts.primary.get('Mico'),1);assert.equal(counts.secondary.get('mico-id'),1);
 assert.equal(scopeTabs(tabs,'1','Indonesia').length,0);
});
test('closing a tab updates both primary and secondary counts',()=>{
 const counts=countCategories(scopeTabs(tabs.filter(t=>t.id!==2),'2'),hierarchy);
 assert.equal(counts.primary.get('Mico'),3);assert.equal(counts.secondary.get('mico-id'),3);
});
