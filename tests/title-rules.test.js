import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tokenizeTitle,clusterTitles} from '../title-rules.js';
test('Chinese and English segmentation removes boilerplate, numbers and repeated words',()=>{
 const words=tokenizeTitle('数据分析报告 GitHub github 首页 2026');
 assert.ok(words.has('github'));assert.ok(words.has('数据'));assert.ok(!words.has('首页'));assert.ok(!words.has('2026'));
 assert.equal([...words.keys()].filter(x=>x==='github').length,1);
});
test('derive categories from titles without predefined rules',()=>{
 const groups=clusterTitles([{id:1,title:'Goat 收入分析'},{id:2,title:'GOAT 留存报告'},{id:3,title:'旅行 计划'},{id:4,title:'旅行 照片'},{id:5,title:'独立页面'}]);
 assert.equal(groups.get(1),groups.get(2));assert.equal(groups.get(1).toLowerCase(),'goat');
 assert.equal(groups.get(3),'旅行');assert.equal(groups.get(4),'旅行');assert.equal(groups.get(5),'其他');
});
test('no duplicate assignments, empty titles and regrouping',()=>{
 const tabs=[{id:1,title:'React GitHub'},{id:2,title:'React 教程'},{id:3,title:'GitHub 项目'},{id:4}];
 const groups=clusterTitles(tabs);assert.equal(groups.size,4);assert.equal(groups.get(4),'其他');
 assert.equal(clusterTitles([{id:1,title:'单页'}]).get(1),'其他');assert.equal(clusterTitles([]).size,0);
});

test('large groups expose primary and overlapping secondary memberships',async()=>{
 const {titleHierarchy}=await import('../title-rules.js');
 const titles=['Mico印巴增长分享','Mico印巴改革总结','Mico 月会 8月','Mico 月会 7月','Mico印巴月会','Mico 项目规划'];
 const tabs=titles.map((title,id)=>({title,id}));const tree=titleHierarchy(tabs);
 assert.equal(new Set(tree.primary.values()).size,1);
 const children=tree.children.get('Mico');
 const regional=children.find(c=>c.name==='Mico 印巴');const monthly=children.find(c=>c.name==='Mico 月会');
 assert.ok(regional);assert.ok(monthly);assert.ok(regional.ids.includes(4));assert.ok(monthly.ids.includes(4));
 assert.ok(children.every(c=>c.ids.every(id=>tree.primary.get(id)==='Mico')));
 assert.equal(titleHierarchy(tabs.slice(0,2)).children.size,0);
});

test('site suffixes and date fragments do not become topic keywords',async()=>{
 const {titleSubject}=await import('../title-rules.js');
 assert.equal(titleSubject('Mico 印巴 - 飞书云文档'),'Mico 印巴');
 assert.equal(titleSubject('季度复盘 | Google Docs'),'季度复盘');
 assert.equal(titleSubject('Mico - 印巴'),'Mico — 印巴');
 const words=tokenizeTitle('Mico Q3 _2025 - Feishu Docs');
 for(const key of ['feishu','docs','q3','_2025'])assert.ok(!words.has(key));
 const tabs=['Mico 印巴','Mico 月会','旅行 计划'].map((title,id)=>({id,title:title+' - Example Workspace',url:'https://example.com/'+id}));
 const groups=clusterTitles(tabs);assert.equal(groups.get(0),'Mico');assert.equal(groups.get(2),'其他');
});
