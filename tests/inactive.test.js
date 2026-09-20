import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inactiveFor,isInactive,accessLabel} from '../core.js';
const now=1800000000000,day=86400000;
test('inactivity threshold includes exact boundary',()=>{
 assert.equal(isInactive({lastAccessed:now-7*day},7,now),true);
 assert.equal(isInactive({lastAccessed:now-7*day+1},7,now),false);
 assert.equal(isInactive({lastAccessed:now-30*day},30,now),true);
});
test('active and unknown dates are excluded, including future and invalid times',()=>{
 assert.equal(isInactive({active:true,lastAccessed:now-60*day},7,now),false);
 for(const lastAccessed of [undefined,0,-1,NaN,Infinity,now+1]){
 assert.equal(inactiveFor({lastAccessed},now),null);
 assert.equal(isInactive({lastAccessed},1,now),false);
 }
});
test('last access labels distinguish unknown, active, hours and days',()=>{
 assert.equal(accessLabel({},now),'访问时间未知');
 assert.equal(accessLabel({active:true},now),'当前活动标签');
 assert.equal(accessLabel({lastAccessed:now-2*3600000},now),'2 小时前访问');
 assert.equal(accessLabel({lastAccessed:now-35*day},now),'35 天未访问');
});
