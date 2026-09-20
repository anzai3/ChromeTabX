import {readThumbnail} from './thumbnail-state.js';
import {i18n} from './i18n.js';
const root=document.getElementById('content');
const live=!!globalThis.chrome?.storage?.session;
const queue=[],queued=new Set(),visible=new Set(),watched=new Map();let active=0;
const zh=()=>i18n.locale.startsWith('zh');
function statusNode(img){
 let node=img.parentElement.querySelector('.thumbnail-status');
 if(!node){node=document.createElement('span');node.className='thumbnail-status';node.dataset.languageUi='';img.after(node);}
 return node;
}
function enqueue(img){if(!queued.has(img)){queued.add(img);queue.push(img);}drain();}
const observer=new IntersectionObserver(entries=>{
 for(const entry of entries){
  const img=watched.get(entry.target);if(!img)continue;
  if(entry.isIntersecting){visible.add(img);enqueue(img);}else visible.delete(img);
 }
},{rootMargin:'80px'});
async function populate(img){
 const id=Number(img.dataset.thumbnail),url=img.dataset.url;
 const result=await readThumbnail(chrome.storage.session,id,url);
 if(!img.isConnected)return;
 const status=statusNode(img);
 if(result.status==='ready'){
  // Reveal before decode: hidden/lazy images can otherwise never fire load.
  img.src=result.image;img.hidden=false;
  try{await img.decode();if(img.isConnected)status.hidden=true;}
  catch{img.hidden=true;status.hidden=false;status.textContent=zh()?'缩略图读取失败':'Thumbnail could not be decoded';}
 }else{
  status.hidden=false;
  status.textContent=result.status==='error'?(zh()?'缩略图暂不可用':'Thumbnail unavailable'):(zh()?'正在生成缩略图…':'Preparing thumbnail…');
  status.title=result.error||'';
  await chrome.runtime.sendMessage({type:'thumbnail',id,url});
 }
}
function drain(){
 while(active<2 && queue.length){
  const img=queue.shift();queued.delete(img);if(!img.isConnected)continue;
  active++;
  populate(img).catch(error=>{
   if(img.isConnected){const status=statusNode(img);status.hidden=false;status.textContent=zh()?'请重新加载扩展':'Please reload the extension';status.title=error.message;}
  }).finally(()=>{active--;drain();});
 }
}
function discover(){
 for(const [card,img] of watched)if(!card.isConnected){observer.unobserve(card);watched.delete(card);visible.delete(img);}
 root.querySelectorAll('[data-thumbnail]').forEach(img=>{
  const card=img.closest('.card');if(!watched.has(card)){watched.set(card,img);observer.observe(card);}
 });
}
if(live){
 new MutationObserver(discover).observe(root,{childList:true});discover();
 chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='session')return;
  for(const img of visible)if(changes[`thumb:${img.dataset.thumbnail}`] || changes[`thumb-state:${img.dataset.thumbnail}`])enqueue(img);
 });
 i18n.subscribe(()=>{for(const img of visible)enqueue(img);});
}
