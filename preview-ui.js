import {extractPagePreview,createPreviewReader} from './page-preview.js';
import {i18n} from './i18n.js';
const zh=()=>i18n.locale.startsWith('zh');
const copy=()=>zh()?{loading:'正在读取页面简介…',unavailable:'页面简介暂不可用',preview:'预览',close:'关闭预览',note:'网页文字预览 · 非实时画面',open:'打开原标签'}:{loading:'Reading page summary…',unavailable:'Page summary unavailable',preview:'Preview',close:'Close preview',note:'Page text preview · Not a live view',open:'Open original tab'};
function unavailable(data) {
 const messages=zh()?{
  discarded:'此标签已休眠，正文尚未加载。请先打开原标签，加载完成后返回预览。',
  permission:'没有读取此页面的权限。请在扩展的网站访问设置中允许此网站，然后重试。',
  empty:'页面暂无可读取的文字，可能尚未加载、需要登录，或使用嵌入式文档。请先打开原标签查看。',
  protected:'浏览器不允许读取此页面。',timeout:'读取超时，请稍后重试。',changed:'页面地址已变化，请重新预览。',
  unreadable:'暂时无法读取页面。请打开原标签确认已加载，并检查扩展的网站访问权限。'
 }:{discarded:'This tab is sleeping and its content is not loaded. Open the original tab, let it load, then return to preview.',permission:'Page access is not allowed. Enable this site in the extension’s site access settings, then retry.',empty:'No readable text yet. The page may need loading or sign-in, or use an embedded document. Open the original tab to check.',protected:'Chrome does not allow this page to be read.',timeout:'Reading timed out. Please retry.',changed:'The page URL changed. Please preview again.',unreadable:'Could not read this page. Open the original tab to check it has loaded and check the extension’s site access.'};
 return messages[data?.reason]||messages.unreadable;
}
const live=!!globalThis.chrome?.tabs?.get;
const read=createPreviewReader(async tab=>live ? chrome.scripting.executeScript({target:{tabId:tab.id},func:extractPagePreview}) : [{frameId:0,result:{url:tab.url,summary:'Sample page summary for the preview. Load the extension to read your open pages.',excerpt:'This is sample preview content. In the installed extension, this panel shows the page description and an excerpt of readable text, without switching to the original tab.'}}]);
const dialog=document.getElementById('page-preview');
let request=0,selected=null;
function labels(){
 const c=copy();document.getElementById('preview-note').textContent=c.note;
 document.getElementById('preview-close').setAttribute('aria-label',c.close);
 document.getElementById('preview-open').textContent=c.open;
 document.querySelectorAll('[data-preview]').forEach(b=>b.textContent=c.preview);
 document.querySelectorAll('[data-summary-state]').forEach(n=>{if(n.dataset.summaryState!=='done')n.textContent='';});
}
async function getTab(id,node){return live?chrome.tabs.get(id):{id,url:node.dataset.url,title:node.dataset.title};}
async function populate(node){
 try {
  const tab=await getTab(Number(node.dataset.summary),node),url=tab.url;
  const data=await read(tab);
  if(!node.isConnected || node.dataset.url!==url)return;
  if(live && (await chrome.tabs.get(tab.id)).url!==url)return;
  node.dataset.summaryState=data.state==='done'?'done':'unavailable';
  node.textContent=data.state==='done'?data.summary:'';
 }catch{if(node.isConnected){node.dataset.summaryState='unavailable';node.textContent='';}}
}
const queue=[];let active=0;
function drain(){while(active<2&&queue.length){const node=queue.shift();if(!node.isConnected)continue;active++;populate(node).finally(()=>{active--;drain();});}}
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);queue.push(entry.target);}drain();},{rootMargin:'100px'});
const watched=new Set();
function discover(){
 for(const node of watched)if(!node.isConnected){observer.unobserve(node);watched.delete(node);}
 document.querySelectorAll('[data-summary]').forEach(node=>{if(watched.has(node))return;watched.add(node);node.textContent='';observer.observe(node);});
 labels();
}
new MutationObserver(discover).observe(document.getElementById('content'),{childList:true});
discover();i18n.subscribe(labels);
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-preview]');if(!button)return;
 const node=button.closest('.card').querySelector('[data-summary]');
 const epoch=++request;selected=null;
 document.getElementById('preview-title').textContent=node.dataset.title;
 document.getElementById('preview-url').textContent=node.dataset.url;
 document.getElementById('preview-body').textContent=copy().loading;
 document.getElementById('preview-open').disabled=true;
 if(!dialog.open)dialog.showModal();
 try {
  const tab=await getTab(Number(button.dataset.preview),node);
  const data=await read(tab);
  if(epoch!==request)return;
  if(live && (await chrome.tabs.get(tab.id)).url!==tab.url)throw Error('changed');
  selected=tab;document.getElementById('preview-title').textContent=tab.title||'';
  document.getElementById('preview-url').textContent=tab.url||'';
  document.getElementById('preview-body').textContent=data.state==='done'?data.excerpt:unavailable(data);
  document.getElementById('preview-open').disabled=!live;
 }catch{if(epoch===request)document.getElementById('preview-body').textContent=copy().unavailable;}
});
document.getElementById('preview-close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{request++;selected=null;});
document.getElementById('preview-open').onclick=async()=>{
 try{if(selected&&live){await chrome.tabs.update(selected.id,{active:true});await chrome.windows.update(selected.windowId,{focused:true});dialog.close();}}
 catch{document.getElementById('preview-body').textContent=copy().unavailable;}
};
labels();
