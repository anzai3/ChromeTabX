import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('new tabs load once, manual refresh works, hidden pages defer five-minute updates',async()=>{
 let calls=0,now=0,timer;
 const nodes=new Map();const listeners={};
 const document={hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,{classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}});return nodes.get(id);},addEventListener:(name,fn)=>listeners[name]=fn};
 const context=vm.createContext({document,location:{protocol:'chrome-extension:'},chrome:{runtime:{sendNativeMessage:async()=>{calls++;return {ok:true,memoryBytes:1024**3};}}},Date:{now:()=>now},setTimeout:(fn,ms)=>{timer={fn,ms};return 1;},clearTimeout:()=>{timer=null;}});
 vm.runInContext(readFileSync(new URL('../metrics.js',import.meta.url),'utf8').replace('export async function','async function'),context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,1);assert.equal(timer.ms,300000);
 now=1000;await nodes.get('refresh-metrics').onclick();assert.equal(calls,2);
 document.hidden=true;now=301000;timer.fn();assert.equal(calls,2);
 document.hidden=false;listeners.visibilitychange();await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,3);
 listeners.visibilitychange();assert.equal(calls,3);
 now=601000;timer.fn();await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,4);
});
