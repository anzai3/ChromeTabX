import test from 'node:test';
import assert from 'node:assert/strict';
import {addUsage,dayKey} from '../usage.js';
test('overlapping manager intervals are counted once',()=>{
 const now=Date.now();let state=addUsage({},now-10000,now-5000);state=addUsage(state,now-8000,now);
 assert.equal(state.total,10000);assert.equal(addUsage(state,now-5000,now).total,10000);
});
test('midnight splits daily usage while preserving total',()=>{
 const midnight=new Date(2026,8,23).getTime();const state=addUsage({},midnight-2000,midnight+3000);
 assert.equal(state.total,5000);assert.equal(state.today,3000);assert.equal(state.day,dayKey(midnight));
});
test('sleep gaps and invalid intervals are ignored',()=>{
 assert.equal(addUsage({},0,60000).total,0);assert.equal(addUsage({},NaN,100).total,0);
});
