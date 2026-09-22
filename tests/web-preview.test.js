import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewUrl} from '../web-preview.js';
test('web previews only embed public HTTP(S) URL schemes without credentials',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','chrome://settings','chrome-extension://id/newtab.html','https://user:secret@example.com','bad'])assert.equal(previewUrl(url),null);
 assert.equal(previewUrl('https://example.com/doc?q=1#section'),'https://example.com/doc?q=1#section');
});

test('hover preview survives button replacement and starts iframe before live metadata resolves',async()=>{
 const saved=Object.fromEntries(['document','window','MutationObserver','innerWidth','innerHeight','chrome'].map(k=>[k,globalThis[k]]));
 let observerCallback,resolveTab;
 class Element {
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.listeners={};this.hidden=false;this.isConnected=true;this.offsetWidth=600;this.offsetHeight=500;}
  setAttribute(k,v){this[k]=v;}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  removeEventListener(k){delete this.listeners[k];}
  querySelector(selector){return this.children.find(n=>n.tag===selector)||this.children.map(n=>n.querySelector(selector)).find(Boolean)||null;}
  contains(node){return node===this||this.children.some(n=>n.contains(node));}
  remove(){this.isConnected=false;}
  getBoundingClientRect(){return {right:200,left:150,top:100};}
 }
 const root=new Element('root'),body=new Element('body');
 const doc={body,hidden:false,createElement:tag=>new Element(tag),querySelector:()=>null,addEventListener(){},removeEventListener(){}};
 const makeButton=()=>{const b=new Element('button');b.dataset.preview='1';const summary={dataset:{url:'https://example.com/',title:'Example'}};b.closest=s=>s==='[data-preview]'?b:{querySelector:()=>summary};return b;};
 let button=makeButton();root.querySelectorAll=()=>[button];
 try{
  globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.innerWidth=1200;globalThis.innerHeight=900;
  globalThis.MutationObserver=class{constructor(fn){observerCallback=fn;}observe(){}disconnect(){}};
  globalThis.chrome={tabs:{get:()=>new Promise(resolve=>{resolveTab=resolve;})}};
  const {mountWebPreview}=await import('../web-preview.js');
  const mounted=mountWebPreview({root,doc,locale:{locale:'en',subscribe:()=>()=>{}}});
  root.listeners.pointerover({pointerType:'mouse',target:button,relatedTarget:null});
  await new Promise(resolve=>setTimeout(resolve,180));
  const panel=body.children[0],frame=panel.querySelector('iframe');
  assert.equal(frame.src,'https://example.com/');assert.equal(panel.hidden,false);
  const loading=panel.children[0].children[1];assert.equal(loading.className,'web-preview-loading');
  frame.listeners.load();assert.equal(loading.hidden,true);
  button.isConnected=false;button=makeButton();observerCallback();
  root.listeners.pointerover({pointerType:'mouse',target:button,relatedTarget:null});
  root.listeners.pointerout({target:button,relatedTarget:null});
  await new Promise(resolve=>setTimeout(resolve,260));
  assert.equal(panel.hidden,false);assert.equal(panel.querySelector('iframe'),frame);
  resolveTab({id:1,url:'https://example.com/',title:'Example',windowId:1});await Promise.resolve();
  mounted.destroy();
 }finally{for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
